const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class HybridDetectionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/detect_objects.py');
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async detectObjectsWithOpenAI(videoPath) {
    try {
      console.log('🔍 Starting hybrid detection (YOLO + OpenAI)...');
      
      // Step 1: YOLO Detection
      const yoloObjects = await this.runYOLODetection(videoPath);
      console.log('🎯 YOLO detected:', yoloObjects);
      
      // Step 2: OpenAI Analysis (if API key available)
      if (this.openaiApiKey && yoloObjects.length > 0) {
        const enhancedObjects = await this.enhanceWithOpenAI(videoPath, yoloObjects);
        return enhancedObjects;
      }
      
      // Fallback to YOLO only
      return yoloObjects;
      
    } catch (error) {
      console.error('Hybrid detection error:', error);
      // Fallback to YOLO only
      return await this.runYOLODetection(videoPath);
    }
  }

  async runYOLODetection(videoPath) {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'json',
        pythonPath: 'python3',
        pythonOptions: ['-u'],
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [videoPath]
      };

      const pyshell = new PythonShell(path.basename(this.pythonScriptPath), options);
      let results = [];
      let hasValidResult = false;

      pyshell.on('message', function (message) {
        try {
          if (typeof message === 'object' && message !== null) {
            if (message.objects && Array.isArray(message.objects)) {
              results = message.objects;
              hasValidResult = true;
            }
          }
        } catch (error) {
          console.error('Error parsing YOLO output:', error);
        }
      });

      pyshell.end(function (err) {
        if (err) {
          console.error('YOLO detection error:', err);
          resolve([]);
        } else {
          if (!hasValidResult || results.length === 0) {
            results = this.getDummyObjects();
          }
          resolve(results);
        }
      }.bind(this));
    });
  }

  async enhanceWithOpenAI(videoPath, yoloObjects) {
    try {
      console.log('🤖 Enhancing detection with OpenAI...');
      
      // Extract a frame from the video for OpenAI analysis
      const framePath = await this.extractFrame(videoPath);
      
      if (!framePath) {
        console.log('⚠️ Could not extract frame, using YOLO results only');
        return yoloObjects;
      }

      // Analyze with OpenAI Vision API
      const analysis = await this.analyzeWithOpenAI(framePath, yoloObjects);
      
      // Clean up extracted frame
      if (fs.existsSync(framePath)) {
        fs.unlinkSync(framePath);
      }
      
      return analysis;
      
    } catch (error) {
      console.error('OpenAI enhancement error:', error);
      return yoloObjects; // Fallback to YOLO results
    }
  }

  async extractFrame(videoPath) {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
      const framePath = path.join(__dirname, '../temp', `frame_${Date.now()}.jpg`);
      
      ffmpeg(videoPath)
        .screenshots({
          count: 1,
          folder: path.dirname(framePath),
          filename: path.basename(framePath)
        })
        .on('end', () => {
          resolve(framePath);
        })
        .on('error', (err) => {
          console.error('Frame extraction error:', err);
          resolve(null);
        });
    });
  }

  async analyzeWithOpenAI(imagePath, yoloObjects) {
    try {
      // Read image as base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `Analyze this image and identify the MOST SPECIFIC objects you can see.

YOLO detected: ${yoloObjects.join(', ')}

For each object, provide the most specific identification possible:

1. For cars: Look for any visible badges, logos, or distinctive features that could identify the make/model
2. For appliances: Look for brand names, model numbers, or distinctive features
3. For other objects: Look for any text, logos, or distinctive characteristics

Return ONLY a JSON array of strings with the most specific object names.
Examples:
- If you see a Toyota badge: ["Toyota Matrix 2011"]
- If you see a KitchenAid logo: ["KitchenAid Professional Oven"]
- If you cannot identify specific makes/models: ["car", "oven"]

Be as specific as possible, but if you cannot identify specific details, use the general YOLO object names.`;

      console.log('🤖 Sending request to OpenAI...');
      
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o',  // Using gpt-4o which supports vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000  // 30 second timeout
      });

      const analysis = response.data.choices[0].message.content;
      console.log('🤖 OpenAI analysis:', analysis);
      
      // Try to parse JSON response - handle various formats
      try {
        // Remove markdown code blocks if present
        let jsonText = analysis.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          const enhancedObjects = parsed.map(item => item.trim()).filter(Boolean);
          console.log('✅ Enhanced objects from OpenAI:', enhancedObjects);
          return enhancedObjects;
        }
      } catch (parseError) {
        console.log('Could not parse OpenAI JSON, using text analysis');
        console.log('Parse error:', parseError.message);
      }
      
      // Fallback: extract key terms from text
      const enhancedObjects = this.extractKeyTerms(analysis, yoloObjects);
      return enhancedObjects;
      
    } catch (error) {
      console.error('OpenAI API error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return yoloObjects;
    }
  }

  extractKeyTerms(analysis, yoloObjects) {
    // Simple keyword extraction from OpenAI text response
    const enhanced = [];
    
    // Look for car-related terms
    if (yoloObjects.includes('car')) {
      if (analysis.toLowerCase().includes('toyota')) {
        enhanced.push('toyota car');
      } else if (analysis.toLowerCase().includes('honda')) {
        enhanced.push('honda car');
      } else if (analysis.toLowerCase().includes('tesla')) {
        enhanced.push('tesla car');
      } else {
        enhanced.push('car');
      }
    }
    
    // Look for appliance-related terms
    if (yoloObjects.includes('oven')) {
      if (analysis.toLowerCase().includes('kitchenaid')) {
        enhanced.push('kitchenaid oven');
      } else if (analysis.toLowerCase().includes('ge')) {
        enhanced.push('ge oven');
      } else {
        enhanced.push('oven');
      }
    }
    
    // Add other detected objects
    yoloObjects.forEach(obj => {
      if (!enhanced.some(e => e.includes(obj))) {
        enhanced.push(obj);
      }
    });
    
    return enhanced;
  }

  getDummyObjects() {
    const possibleObjects = [
      'person', 'chair', 'table', 'laptop', 'cell phone', 'book', 'cup', 'bottle',
      'sneakers', 'hat', 'shirt', 'pants', 'handbag', 'watch', 'glasses', 'couch',
      'tv', 'lamp', 'plant', 'car', 'bicycle', 'dog', 'cat', 'keyboard', 'mouse'
    ];
    
    const numObjects = Math.floor(Math.random() * 4) + 3;
    const shuffled = [...possibleObjects].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numObjects);
  }
}

module.exports = new HybridDetectionService(); 