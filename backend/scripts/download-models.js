#!/usr/bin/env node

/**
 * Model Download Script
 * Downloads required models for object detection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream/promises');

const MODELS_DIR = path.join(__dirname, '..', 'models');
const YOLO_MODEL_URL = 'https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt';
const YOLO_MODEL_PATH = path.join(MODELS_DIR, 'yolov8n.pt');

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destination, () => {}); // Delete the file async
        reject(err);
      });
    }).on('error', reject);
  });
}

async function ensureModelsDirectory() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log('Created models directory');
  }
}

async function downloadYoloModel() {
  try {
    await ensureModelsDirectory();
    
    if (fs.existsSync(YOLO_MODEL_PATH)) {
      console.log('YOLO model already exists, skipping download');
      return;
    }
    
    console.log('Downloading YOLO model...');
    await downloadFile(YOLO_MODEL_URL, YOLO_MODEL_PATH);
    console.log('YOLO model downloaded successfully');
  } catch (error) {
    console.error('Error downloading YOLO model:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting model download...');
    await downloadYoloModel();
    console.log('All models downloaded successfully');
  } catch (error) {
    console.error('Model download failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { downloadYoloModel, ensureModelsDirectory }; 