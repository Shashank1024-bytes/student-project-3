// Search functionality
let allProjects = [];

// Initialize the search page
document.addEventListener('DOMContentLoaded', function() {
    loadAllProjects();
    
    // Add enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProjects();
        }
    });
});

// Load all projects from the API
async function loadAllProjects() {
    try {
        showLoading();
        const response = await fetch('/api/projects');
        const result = await response.json();
        
        console.log('API Response:', result); // Debug log
        
        if (result.success) {
            allProjects = result.projects || [];
            console.log('Projects loaded:', allProjects.length); // Debug log
            displayProjects(allProjects);
        } else {
            showError('Failed to load projects: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error loading projects: ' + error.message);
    }
}

// Search projects based on query and type
async function searchProjects() {
    const query = document.getElementById('searchInput').value.trim();
    const type = document.getElementById('searchType').value;
    
    console.log('Search query:', query, 'Type:', type); // Debug log
    
    if (!query) {
        displayProjects(allProjects);
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}`);
        const result = await response.json();
        
        console.log('Search API Response:', result); // Debug log
        
        if (result.success) {
            displayProjects(result.projects || []);
        } else {
            showError('Failed to search projects: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error searching projects: ' + error.message);
    }
}

// Display projects in the results container
function displayProjects(projects) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (projects.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <p>No projects found matching your search criteria</p>
            </div>
        `;
        return;
    }
    
    const resultsHTML = projects.map(project => createProjectHTML(project)).join('');
    resultsContainer.innerHTML = resultsHTML;
}

// Create HTML for a single project
function createProjectHTML(project) {
    const timestamp = new Date(project.timestamp).toLocaleString();
    const date = new Date(project.timestamp).toLocaleDateString();
    const time = new Date(project.timestamp).toLocaleTimeString();
    const membersHTML = project.teamMembers.map(member => 
        `<span class="member-badge">${member.name} (${member.usn})</span>`
    ).join('');
    
    // Create file list HTML
    let fileListHTML = '';
    if (project.files) {
        const fileItems = [];
        
        if (project.files.readme) {
            fileItems.push(`
                <div class="file-item">
                    <span class="file-name">📄 ${project.files.readme.name || 'ReadMe.txt'}</span>
                    <span class="file-size">${formatFileSize(project.files.readme.size || 0)}</span>
                </div>
            `);
        }
        
        if (project.files.installation) {
            fileItems.push(`
                <div class="file-item">
                    <span class="file-name">📋 ${project.files.installation.name || 'installation.pdf'}</span>
                    <span class="file-size">${formatFileSize(project.files.installation.size || 0)}</span>
                </div>
            `);
        }
        
        if (project.files.source) {
            fileItems.push(`
                <div class="file-item">
                    <span class="file-name">🗜️ ${project.files.source.name || 'project.zip'}</span>
                    <span class="file-size">${formatFileSize(project.files.source.size || 0)}</span>
                </div>
            `);
        }
        
        if (project.files.teamMembers) {
            fileItems.push(`
                <div class="file-item">
                    <span class="file-name">👥 ${project.files.teamMembers.name || 'team-members.txt'}</span>
                    <span class="file-size">${formatFileSize(project.files.teamMembers.size || 0)}</span>
                </div>
            `);
        }
        
        if (fileItems.length > 0) {
            fileListHTML = `
                <div class="file-list">
                    <strong>Files:</strong>
                    ${fileItems.join('')}
                </div>
            `;
        }
    }
    
    return `
        <div class="result-item">
            <div class="result-header">
                <div>
                    <div class="result-title">${project.projectName}</div>
                    <div class="result-timestamp">📅 ${date} | 🕐 ${time}</div>
                    <div class="result-timestamp">📁 ${project.folderName}</div>
                </div>
            </div>
            <div class="result-details">
                <div class="result-members">
                    <strong>Team Members:</strong>
                    <div class="member-list">
                        ${membersHTML}
                    </div>
                </div>
                <div class="result-path">
                    <strong>Folder Path:</strong> ${project.projectPath}
                </div>
                ${fileListHTML}
            </div>
            <div class="result-actions">
                <button class="btn-open" onclick="openProjectFolder('${project.projectPath}')">
                    📁 Open Folder
                </button>
                <button class="btn-open" onclick="viewProjectDetails('${project.id}')">
                    📋 View Details
                </button>
                ${project.files && project.files.readme ? `
                    <a href="/api/download/${project.id}/readme" class="btn-download" download>
                        📄 README
                    </a>
                ` : ''}
                ${project.files && project.files.installation ? `
                    <a href="/api/download/${project.id}/installation" class="btn-download" download>
                        📋 Installation
                    </a>
                ` : ''}
                ${project.files && project.files.source ? `
                    <a href="/api/download/${project.id}/source" class="btn-download" download>
                        🗜️ Source Code
                    </a>
                ` : ''}
                ${project.files && project.files.teamMembers ? `
                    <a href="/api/download/${project.id}/teamMembers" class="btn-download" download>
                        👥 Team Members
                    </a>
                ` : ''}
                <a href="/api/download-project/${project.id}" class="btn-download-all" download>
                    📦 Download All
                </a>
            </div>
        </div>
    `;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Open project folder in file explorer
function openProjectFolder(folderPath) {
    // In a real application, this would open file explorer
    // For security reasons, we'll show a message instead
    alert(`Would open folder: ${folderPath}\n\nIn a real application, this would open your system's file explorer to the project location.`);
}

// View detailed project information
async function viewProjectDetails(projectId) {
    try {
        const response = await fetch(`/api/project/${projectId}`);
        const result = await response.json();
        
        if (result.success) {
            const project = result.project;
            const timestamp = new Date(project.timestamp).toLocaleString();
            
            let filesInfo = '';
            if (project.files) {
                const files = [];
                if (project.files.readme) files.push(`- README: ${project.files.readme.name} (${formatFileSize(project.files.readme.size)})`);
                if (project.files.installation) files.push(`- Installation: ${project.files.installation.name} (${formatFileSize(project.files.installation.size)})`);
                if (project.files.source) files.push(`- Source: ${project.files.source.name} (${formatFileSize(project.files.source.size)})`);
                if (project.files.teamMembers) files.push(`- Team Members: ${project.files.teamMembers.name} (${formatFileSize(project.files.teamMembers.size)})`);
                filesInfo = files.join('\n');
            }
            
            const details = `
Project Details:
================
Project Name: ${project.projectName}
Timestamp: ${timestamp}
Folder Name: ${project.folderName}
Folder Path: ${project.projectPath}

Team Members:
${project.teamMembers.map(member => `- ${member.name} (${member.usn})`).join('\n')}

Files:
${filesInfo || 'No files found'}
            `;
            
            alert(details);
        } else {
            alert('Failed to load project details: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading project details');
    }
}

// Show loading state
function showLoading() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            Searching projects...
        </div>
    `;
}

// Show error message
function showError(message) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
        <div class="no-results">
            <div class="no-results-icon">❌</div>
            <p>${message}</p>
        </div>
    `;
}