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
      return [];
    }

    // Check file size
    const stats = fs.statSync(videoPath);
    console.log(`Video file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error('Video file is empty');
      return [];
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
          
          if (typeof message === 'object' && message !== null) {
            if (message.objects && Array.isArray(message.objects)) {
              results = message.objects;
            } else if (message.error) {
              console.error('Python script error:', message.error);
              hasError = true;
            }
          }
        } catch (error) {
          console.error('Error processing Python output:', error);
          hasError = true;
        }
      });

      pyshell.on('error', function (err) {
        console.error('Python script execution error:', err);
        hasError = true;
      });

      pyshell.end(function (err) {
        if (err) {
          console.error('Python script execution error:', err);
          hasError = true;
        }
        
        if (hasError || results.length === 0) {
          console.log('Detection failed or no objects detected');
          resolve([]); // Return empty array instead of fake objects
        } else {
          console.log(`Final detected objects: ${results.join(', ')}`);
          resolve(results);
        }
      }.bind(this));
    });
  }
}

module.exports = new ObjectDetectionService(); 