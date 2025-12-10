const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initializeDatabase, DatabaseService } = require('./database');

const app = express();
const PORT = 3000;

// Initialize database
initializeDatabase();
const dbService = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Default save location
const DEFAULT_SAVE_PATH = 'D:\\Main-projects 2k25';

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, 'uploads', 'temp');
    fs.ensureDirSync(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to generate clean project folder name with timestamp
function generateFolderName(projectName) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  
  // Clean project name for file system
  const cleanProjectName = projectName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length
  
  return `${cleanProjectName}_${timestamp}`;
}

// Helper function to create project folder structure
async function createProjectStructure(basePath, projectName) {
  const folderName = generateFolderName(projectName);
  const projectPath = path.join(basePath, folderName);
  
  // Create directory structure with numbered folders
  await fs.ensureDir(path.join(projectPath, '1.INSTALLATION'));
  await fs.ensureDir(path.join(projectPath, '2.README'));
  await fs.ensureDir(path.join(projectPath, '3.SOURCE'));
  
  return { projectPath, folderName };
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// API to check default location and ask user preference
app.post('/api/location-preference', async (req, res) => {
  try {
    const { useDefault } = req.body;
    
    if (useDefault) {
      // Ensure default directory exists
      await fs.ensureDir(DEFAULT_SAVE_PATH);
      res.json({ success: true, path: DEFAULT_SAVE_PATH });
    } else {
      // Return message for client to show folder picker
      res.json({ success: true, needsFolderPicker: true });
    }
  } catch (error) {
    console.error('Error handling location preference:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to create project folder
app.post('/api/create-project', async (req, res) => {
  try {
    const { projectName, savePath, teamMembers } = req.body;
    
    if (!projectName || !savePath) {
      return res.status(400).json({ success: false, error: 'Project name and save path are required' });
    }
    
    // Normalize and validate the save path
    const normalizedPath = path.resolve(savePath);
    
    // Ensure save path exists
    await fs.ensureDir(normalizedPath);
    
    // Create project structure with timestamp
    const { projectPath, folderName } = await createProjectStructure(normalizedPath, projectName);
    
    // Create student-info.txt file immediately if team members are provided
    let studentInfoPath = null;
    if (teamMembers && teamMembers.length > 0) {
      const studentInfoContent = teamMembers.map((member, index) => 
        `Member ${index + 1}:\nName: ${member.name}\nUSN: ${member.usn}`
      ).join('\n\n');
      
      const studentInfoHeader = `STUDENT INFORMATION\n==================\nProject: ${projectName}\nDate: ${new Date().toLocaleString()}\n\n${studentInfoContent}`;
      
      studentInfoPath = path.join(projectPath, 'student-info.txt');
      await fs.writeFile(studentInfoPath, studentInfoHeader, 'utf8');
      
      console.log(`Student info file created: ${studentInfoPath}`);
    }
    
    console.log(`Project created: ${projectName} at ${projectPath}`);
    
    res.json({ 
      success: true, 
      projectPath, 
      folderName,
      savePath: normalizedPath,
      studentInfoPath,
      message: 'Project folder created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to upload README file
app.post('/api/upload-readme', upload.single('readme'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const { projectPath } = req.body;
    if (!projectPath) {
      return res.status(400).json({ success: false, error: 'Project path is required' });
    }
    
    // Keep original file extension for README file
    const ext = path.extname(req.file.originalname);
    const readmeFileName = ext ? `ReadMe${ext}` : 'ReadMe.txt';
    const readmePath = path.join(projectPath, '2.README', readmeFileName);
    
    // Move file to README folder
    await fs.move(req.file.path, readmePath, { overwrite: true });
    
    res.json({ 
      success: true, 
      readmePath,
      fileName: readmeFileName,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading README:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to upload installation file
app.post('/api/upload-installation', upload.single('installation'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const { projectPath } = req.body;
    if (!projectPath) {
      return res.status(400).json({ success: false, error: 'Project path is required' });
    }
    
    // Get file extension
    const ext = path.extname(req.file.originalname);
    const installPath = path.join(projectPath, '1.INSTALLATION', `installation${ext}`);
    
    // Move file to INSTALLATION folder
    await fs.move(req.file.path, installPath, { overwrite: true });
    
    res.json({ 
      success: true, 
      installPath,
      fileName: `installation${ext}`,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading installation file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to upload source code ZIP
app.post('/api/upload-source', upload.single('source'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const { projectPath } = req.body;
    if (!projectPath) {
      return res.status(400).json({ success: false, error: 'Project path is required' });
    }
    
    // Move file to SOURCE folder
    const sourcePath = path.join(projectPath, '3.SOURCE', 'project.zip');
    await fs.move(req.file.path, sourcePath, { overwrite: true });
    
    res.json({ 
      success: true, 
      sourcePath,
      fileName: 'project.zip',
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading source file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to save project metadata and complete submission
app.post('/api/complete-project', async (req, res) => {
  try {
    const { 
      projectName, 
      teamMembers, 
      projectPath, 
      folderName,
      readmeFile,
      installationFile,
      sourceFile
    } = req.body;
    
    if (!projectName || !teamMembers || !projectPath) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Create project metadata
    const projectData = {
      id: uuidv4(),
      projectName,
      timestamp: new Date().toISOString(),
      teamMembers: teamMembers.map(member => ({
        name: member.name,
        usn: member.usn
      })),
      folderName,
      projectPath,
      files: {
        readme: {
          name: readmeFile.name || 'ReadMe.txt',
          path: path.join(projectPath, '2.README', readmeFile.name || 'ReadMe.txt'),
          size: readmeFile.size || 0
        },
        installation: {
          name: installationFile.name || 'installation.txt',
          path: path.join(projectPath, '1.INSTALLATION', installationFile.name || 'installation.txt'),
          size: installationFile.size || 0
        },
        source: {
          name: 'project.zip',
          path: path.join(projectPath, '3.SOURCE', 'project.zip'),
          size: sourceFile.size || 0
        }
      }
    };

    // Check if project already exists and update if needed
    const existingProject = dbService.getAllProjects().find(p => 
      p.projectName === projectName && 
      p.projectPath === projectPath
    );

    if (existingProject) {
      // Update existing project
      projectData.id = existingProject.id;
      projectData.timestamp = existingProject.timestamp; // Keep original timestamp
      dbService.updateProject(existingProject.id, projectData);
      console.log(`Updated existing project: ${projectName}`);
    } else {
      // Create new project
      dbService.createProject(projectData);
      console.log(`Created new project: ${projectName}`);
    }
    
    // Save to database
    dbService.createProject(projectData);
    
    // Check if student-info.txt already exists (created during project creation)
    let studentInfoPath = path.join(projectPath, 'student-info.txt');
    let studentInfoSize = 0;
    
    if (fs.existsSync(studentInfoPath)) {
      const stats = await fs.stat(studentInfoPath);
      studentInfoSize = stats.size;
    } else {
      // Create it if it doesn't exist (fallback)
      const studentInfoContent = teamMembers.map((member, index) => 
        `Member ${index + 1}:\nName: ${member.name}\nUSN: ${member.usn}`
      ).join('\n\n');
      
      const studentInfoHeader = `STUDENT INFORMATION\n==================\nProject: ${projectName}\nDate: ${new Date().toLocaleString()}\n\n${studentInfoContent}`;
      
      await fs.writeFile(studentInfoPath, studentInfoHeader, 'utf8');
      studentInfoSize = studentInfoHeader.length;
    }
    
    // Update project data to include student info file
    projectData.files.studentInfo = {
      name: 'student-info.txt',
      path: studentInfoPath,
      size: studentInfoSize
    };
    
    // Save project-info.json in project folder
    const infoPath = path.join(projectPath, 'project-info.json');
    await fs.writeJson(infoPath, projectData, { spaces: 2 });
    
    res.json({ 
      success: true, 
      projectData,
      message: 'Project submitted successfully'
    });
  } catch (error) {
    console.error('Error completing project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to search projects
app.get('/api/search', async (req, res) => {
  try {
    const { query, type } = req.query;
    
    const projects = dbService.searchProjects(query, type);
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = dbService.getAllProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get project details by ID
app.get('/api/project/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = dbService.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error getting project details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to download project files
app.get('/api/download/:projectId/:fileType', async (req, res) => {
  try {
    const { projectId, fileType } = req.params;
    
    // Get project details
    const project = dbService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Get file path
    let fileData = project.files[fileType];
    
    // Handle studentInfo file for backward compatibility
    if (fileType === 'studentInfo' && !fileData) {
      // Try new structure first
      let studentInfoPath = path.join(project.projectPath, '4.Student-info.txt');
      if (fs.existsSync(studentInfoPath)) {
        fileData = {
          name: '4.Student-info.txt',
          path: studentInfoPath
        };
      } else {
        // Try old structure
        studentInfoPath = path.join(project.projectPath, 'student-info.txt');
        if (fs.existsSync(studentInfoPath)) {
          fileData = {
            name: 'student-info.txt',
            path: studentInfoPath
          };
        }
      }
    }
    
    // Handle teamMembers file for backward compatibility
    if (fileType === 'teamMembers' && !fileData) {
      const teamMembersPath = path.join(project.projectPath, 'team-members.txt');
      if (fs.existsSync(teamMembersPath)) {
        fileData = {
          name: 'team-members.txt',
          path: teamMembersPath
        };
      }
    }
    
    if (!fileData || !fileData.path) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    
    const filePath = fileData.path;
    const fileName = fileData.name;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on disk' });
    }
    
    // Download file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ success: false, error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to download entire project as ZIP
app.get('/api/download-project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get project details
    const project = dbService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Check if project folder exists
    if (!fs.existsSync(project.projectPath)) {
      return res.status(404).json({ success: false, error: 'Project folder not found' });
    }
    
    // Download entire project folder
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set response headers
    res.attachment(`${project.folderName}.zip`);
    
    // Pipe archive to response
    archive.pipe(res);
    
    // Append entire project directory
    archive.directory(project.projectPath, project.folderName);
    
    // Finalize archive
    archive.finalize();
  } catch (error) {
    console.error('Error downloading project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to get database statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = dbService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to update existing folders with new file structure
app.post('/api/update-existing-folders', async (req, res) => {
  try {
    const projects = dbService.getAllProjects();
    let updatedCount = 0;
    
    for (const project of projects) {
      try {
        // Check if project folder exists
        if (fs.existsSync(project.projectPath)) {
          let needsUpdate = false;
          const updatedProject = { ...project };
          
          // Check and create new folder structure
          const oldReadmeDir = path.join(project.projectPath, 'README');
          const newReadmeDir = path.join(project.projectPath, '2.README');
          if (fs.existsSync(oldReadmeDir) && !fs.existsSync(newReadmeDir)) {
            await fs.move(oldReadmeDir, newReadmeDir);
            needsUpdate = true;
          }
          
          const oldInstallDir = path.join(project.projectPath, 'INSTALLATION');
          const newInstallDir = path.join(project.projectPath, '1.INSTALLATION');
          if (fs.existsSync(oldInstallDir) && !fs.existsSync(newInstallDir)) {
            await fs.move(oldInstallDir, newInstallDir);
            needsUpdate = true;
          }
          
          const oldSourceDir = path.join(project.projectPath, 'SOURCE');
          const newSourceDir = path.join(project.projectPath, '3.SOURCE');
          if (fs.existsSync(oldSourceDir) && !fs.existsSync(newSourceDir)) {
            await fs.move(oldSourceDir, newSourceDir);
            needsUpdate = true;
          }
          
          // Check if student-info.txt already exists in project root
          const studentInfoPath = path.join(project.projectPath, 'student-info.txt');
          const oldTeamMembersPath = path.join(project.projectPath, 'team-members.txt');
          const oldNumberedStudentInfoPath = path.join(project.projectPath, '4.Student-info.txt');
          
          if (!fs.existsSync(studentInfoPath) && project.teamMembers && project.teamMembers.length > 0) {
            // Create student information text file in project root
            const studentInfoContent = project.teamMembers.map((member, index) => 
              `Member ${index + 1}:\nName: ${member.name}\nUSN: ${member.usn}`
            ).join('\n\n');
            
            const studentInfoHeader = `STUDENT INFORMATION\n==================\nProject: ${project.projectName}\nDate: ${new Date().toLocaleString()}\n\n${studentInfoContent}`;
            
            await fs.writeFile(studentInfoPath, studentInfoHeader, 'utf8');
            
            // Remove old team-members.txt if it exists
            if (fs.existsSync(oldTeamMembersPath)) {
              await fs.remove(oldTeamMembersPath);
            }
            
            // Remove old 4.Student-info.txt if it exists
            if (fs.existsSync(oldNumberedStudentInfoPath)) {
              await fs.remove(oldNumberedStudentInfoPath);
            }
            
            // Update project data to include student info file
            updatedProject.files = {
              ...updatedProject.files,
              studentInfo: {
                name: 'student-info.txt',
                path: studentInfoPath,
                size: studentInfoHeader.length || 0
              }
            };
            
            // Remove old teamMembers file reference
            if (updatedProject.files.teamMembers) {
              delete updatedProject.files.teamMembers;
            }
            
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            dbService.updateProject(project.id, updatedProject);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating project ${project.id}:`, error);
      }
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${updatedCount} existing folders with new file structure`,
      updatedCount
    });
  } catch (error) {
    console.error('Error updating existing folders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API to compact database
app.post('/api/compact-database', async (req, res) => {
  try {
    const success = dbService.compactDatabase();
    res.json({ success, message: success ? 'Database compacted successfully' : 'Failed to compact database' });
  } catch (error) {
    console.error('Error compacting database:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Student Project Portal running on http://localhost:${PORT}`);
  console.log(`Default save location: ${DEFAULT_SAVE_PATH}`);
  console.log('Database: JSON (projects.json)');
  console.log('Features: Multi-system compatible, no compilation required');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});