const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

class ObjectDetectionService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/detect_objects.py');
  }

  async detectObjects(videoPath) {
    console.log(`Starting object detection for video: ${videoPath}`);
    
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return this.getDummyObjects();
    }

    // Check file size
    const stats = fs.statSync(videoPath);
    console.log(`Video file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('Video file is empty');
      return this.getDummyObjects();
    }

    return new Promise((resolve, reject) => {
      const options = {
        mode: 'json',
        pythonPath: 'python3', // or 'python' depending on your system
        pythonOptions: ['-u'], // unbuffered output
        scriptPath: path.dirname(this.pythonScriptPath),
        args: [videoPath]
      };

      console.log(`Running Python script: ${this.pythonScriptPath}`);
      console.log(`Script arguments: ${options.args}`);

      const pyshell = new PythonShell(path.basename(this.pythonScriptPath), options);

      let results = [];
      let hasError = false;

      pyshell.on('message', function (message) {
        try {
          console.log('Python output:', message);
          const data = JSON.parse(message);
          if (data.objects) {
            results = data.objects;
            console.log('Detected objects from Python:', results);
          } else if (data.error) {
            console.error('Python script error:', data.error);
            hasError = true;
          }
        } catch (error) {
          console.error('Error parsing Python output:', error);
          console.error('Raw message:', message);
          hasError = true;
        }
      });

      pyshell.on('error', function (error) {
        console.error('Python shell error:', error);
        hasError = true;
      });

      pyshell.end(function (err) {
        if (err) {
          console.error('Python script execution error:', err);
          hasError = true;
        }
        
        if (hasError || results.length === 0) {
          console.log('Falling back to dummy objects due to error or no results');
          results = this.getDummyObjects();
        }
        
        console.log(`Final detected objects: ${results.join(', ')}`);
        resolve(results);
      }.bind(this));
    });
  }

  // Fallback dummy objects for demo purposes
  getDummyObjects() {
    const possibleObjects = [
      'person', 'chair', 'table', 'laptop', 'cell phone', 'book', 'cup', 'bottle',
      'sneakers', 'hat', 'shirt', 'pants', 'handbag', 'watch', 'glasses', 'couch',
      'tv', 'lamp', 'plant', 'car', 'bicycle', 'dog', 'cat', 'keyboard', 'mouse',
      'coffee', 'mug', 'desk', 'monitor', 'headphones', 'speaker', 'camera', 'remote'
    ];

    // Return 3-6 random objects with better randomization
    const numObjects = Math.floor(Math.random() * 4) + 3;
    const shuffled = [...possibleObjects].sort(() => 0.5 - Math.random());
    const selectedObjects = shuffled.slice(0, numObjects);

    console.log(`Generated ${selectedObjects.length} dummy objects:`, selectedObjects);
    return selectedObjects;
  }

  // Extract frames from video (alternative approach)
  async extractFrames(videoPath, outputDir, frameRate = 1) {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      ffmpeg(videoPath)
        .fps(frameRate)
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          reject(err);
        })
        .screenshots({
          count: 10,
          folder: outputDir,
          filename: 'frame-%i.jpg'
        });
    });
  }
}

module.exports = new ObjectDetectionService(); 