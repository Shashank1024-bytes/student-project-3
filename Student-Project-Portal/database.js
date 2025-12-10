const fs = require('fs-extra');
const path = require('path');

// Database configuration
const DB_PATH = path.join(__dirname, 'data', 'projects.json');
const DB_BACKUP_PATH = path.join(__dirname, 'data', 'projects_backup.json');

// Initialize database
function initializeDatabase() {
  // Ensure data directory exists
  fs.ensureDirSync(path.dirname(DB_PATH));
  
  // Create database file if it doesn't exist
  if (!fs.existsSync(DB_PATH)) {
    fs.writeJsonSync(DB_PATH, []);
    console.log('Database initialized successfully');
  }
  
  // Create backup
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.copySync(DB_PATH, DB_BACKUP_PATH);
    } catch (error) {
      console.log('Warning: Could not create backup');
    }
  }
}

// Database operations
class DatabaseService {
  constructor() {
    this.dbPath = DB_PATH;
  }
  
  // Read all projects
  readProjects() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return [];
      }
      return fs.readJsonSync(this.dbPath);
    } catch (error) {
      console.error('Error reading database:', error);
      return [];
    }
  }
  
  // Write projects to database
  writeProjects(projects) {
    try {
      // Create backup before writing
      if (fs.existsSync(this.dbPath)) {
        fs.copySync(this.dbPath, DB_BACKUP_PATH);
      }
      
      fs.writeJsonSync(this.dbPath, projects, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error writing database:', error);
      return false;
    }
  }
  
  // Create a new project
  createProject(projectData) {
    const projects = this.readProjects();
    projects.push(projectData);
    return this.writeProjects(projects);
  }
  
  // Get all projects
  getAllProjects() {
    return this.readProjects();
  }
  
  // Get project by ID
  getProjectById(projectId) {
    const projects = this.readProjects();
    return projects.find(p => p.id === projectId);
  }
  
  // Update project
  updateProject(projectId, updateData) {
    const projects = this.readProjects();
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updateData };
      return this.writeProjects(projects);
    }
    
    return false;
  }
  
  // Delete project
  deleteProject(projectId) {
    const projects = this.readProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    return this.writeProjects(filteredProjects);
  }
  
  // Search projects
  searchProjects(query, type = 'all') {
    const projects = this.readProjects();
    
    if (!query) {
      return projects;
    }
    
    const searchQuery = query.toLowerCase();
    let filteredProjects = projects;
    
    switch (type) {
      case 'projectName':
        filteredProjects = projects.filter(p => 
          p.projectName.toLowerCase().includes(searchQuery)
        );
        break;
      case 'memberName':
        filteredProjects = projects.filter(p => 
          p.teamMembers.some(member => 
            member.name.toLowerCase().includes(searchQuery)
          )
        );
        break;
      case 'usn':
        filteredProjects = projects.filter(p => 
          p.teamMembers.some(member => 
            member.usn.toLowerCase().includes(searchQuery)
          )
        );
        break;
      case 'timestamp':
        filteredProjects = projects.filter(p => 
          p.timestamp.toLowerCase().includes(searchQuery)
        );
        break;
      case 'path':
        filteredProjects = projects.filter(p => 
          p.projectPath.toLowerCase().includes(searchQuery) ||
          p.folderName.toLowerCase().includes(searchQuery)
        );
        break;
      default:
        // Search all fields
        filteredProjects = projects.filter(p => 
          p.projectName.toLowerCase().includes(searchQuery) ||
          p.teamMembers.some(member => 
            member.name.toLowerCase().includes(searchQuery) ||
            member.usn.toLowerCase().includes(searchQuery)
          ) ||
          p.timestamp.toLowerCase().includes(searchQuery) ||
          p.projectPath.toLowerCase().includes(searchQuery) ||
          p.folderName.toLowerCase().includes(searchQuery)
        );
    }
    
    return filteredProjects;
  }
  
  // Get database statistics
  getStats() {
    const projects = this.readProjects();
    return {
      totalProjects: projects.length,
      totalMembers: projects.reduce((sum, p) => sum + (p.teamMembers?.length || 0), 0),
      lastUpdated: fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).mtime : null
    };
  }
  
  // Compact database (remove duplicates, fix data integrity)
  compactDatabase() {
    const projects = this.readProjects();
    const uniqueProjects = projects.filter((project, index, self) =>
      index === self.findIndex((p) => p.id === project.id)
    );
    
    // Ensure all required fields exist
    const validProjects = uniqueProjects.map(project => ({
      id: project.id || require('uuid').v4(),
      projectName: project.projectName || 'Unknown Project',
      timestamp: project.timestamp || new Date().toISOString(),
      teamMembers: project.teamMembers || [],
      folderName: project.folderName || '',
      projectPath: project.projectPath || '',
      files: project.files || {}
    }));
    
    return this.writeProjects(validProjects);
  }
}

module.exports = {
  initializeDatabase,
  DatabaseService
};