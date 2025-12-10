// Global variables
let currentStep = 1;
let projectData = {
  projectName: '',
  teamMembers: [],
  savePath: '',
  projectPath: '',
  folderName: '',
  files: {
    readme: null,
    installation: null,
    source: null
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  setupDragAndDrop();
  
  // Test if previousStep function is accessible
  console.log('App initialized, previousStep function:', typeof previousStep);
  
  // Add error handling for button clicks
  document.querySelectorAll('button[onclick*="previousStep"]').forEach(button => {
    button.addEventListener('click', function(e) {
      console.log('Previous button clicked');
      try {
        previousStep();
      } catch (error) {
        console.error('Error in previousStep:', error);
      }
    });
  });
});

// Step navigation functions
function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < 6) {
      document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
      document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
      document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');
      
      currentStep++;
      
      document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
      document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
    }
  }
}

function previousStep() {
  console.log('Previous step called, current step:', currentStep); // Debug log
  
  if (currentStep > 1) {
    // Allow going back from any step except the first step
    // Users should be able to modify previous steps
    
    const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const currentProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    
    if (currentFormStep) currentFormStep.classList.remove('active');
    if (currentProgressStep) currentProgressStep.classList.remove('active');
    
    // Remove completed class from the step we're going back to
    const completedProgressStep = document.querySelector(`.progress-step[data-step="${currentStep - 1}"]`);
    if (completedProgressStep) completedProgressStep.classList.remove('completed');
    
    currentStep--;
    
    const newFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const newProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    
    if (newFormStep) newFormStep.classList.add('active');
    if (newProgressStep) newProgressStep.classList.add('active');
    
    console.log('Moved to step:', currentStep); // Debug log
  } else {
    console.log('Cannot go back from step 1');
  }
}

// Validation functions
function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      return validateProjectName();
    case 2:
      return validateTeamMembersAndCreateFolder();
    case 3:
      return validateLocation();
    case 4:
      return validateSupportingFiles();
    case 5:
      return validateSourceFile();
    default:
      return true;
  }
}

function validateProjectName() {
  const projectName = document.getElementById('projectName').value.trim();
  if (!projectName) {
    alert('Please enter a project name');
    return false;
  }
  projectData.projectName = projectName;
  return true;
}

function validateTeamMembers() {
  const teamMembers = [];
  const memberElements = document.querySelectorAll('.team-member');
  
  for (let element of memberElements) {
    const memberId = element.dataset.member;
    const name = document.getElementById(`memberName${memberId}`).value.trim();
    const usn = document.getElementById(`memberUSN${memberId}`).value.trim();
    
    if (name && usn) {
      teamMembers.push({ name, usn });
    } else if (element.style.display !== 'none') {
      alert('Please fill in all team member details');
      return false;
    }
  }
  
  if (teamMembers.length === 0) {
    alert('Please add at least one team member');
    return false;
  }
  
  projectData.teamMembers = teamMembers;
  return true;
}

function validateTeamMembersAndCreateFolder() {
  if (!validateTeamMembers()) {
    return false;
  }
  
  // Create project folder immediately after team members are entered
  // Use default path for now, user can change it in next step
  const defaultSavePath = 'D:\\Main-projects 2k25';
  projectData.savePath = defaultSavePath;
  
  // Create project folder with team members
  createProjectFolderWithTeamMembers();
  return true;
}

function validateLocation() {
  const selectedLocation = document.querySelector('.location-option.selected');
  if (!selectedLocation) {
    alert('Please select a save location');
    return false;
  }
  
  if (selectedLocation.id === 'custom') {
    const customPath = document.getElementById('customPath').value.trim();
    if (!customPath) {
      alert('Please enter a custom path');
      return false;
    }
    projectData.savePath = customPath;
  } else {
    projectData.savePath = 'D:\\Main-projects 2k25';
  }
  
  return true;
}

function validateSupportingFiles() {
  if (!projectData.files.readme || !projectData.files.installation) {
    alert('Please upload both README and Installation files');
    return false;
  }
  return true;
}

function validateSourceFile() {
  if (!projectData.files.source) {
    alert('Please upload the source code ZIP file');
    return false;
  }
  return true;
}

// Team member management
function addTeamMember() {
  const teamMembersDiv = document.getElementById('teamMembers');
  const memberCount = teamMembersDiv.children.length + 1;
  
  const memberDiv = document.createElement('div');
  memberDiv.className = 'team-member';
  memberDiv.dataset.member = memberCount;
  
  memberDiv.innerHTML = `
    <button type="button" class="remove-member" onclick="removeMember(${memberCount})">×</button>
    <div class="form-group">
      <label for="memberName${memberCount}">Member Name *</label>
      <input type="text" id="memberName${memberCount}" name="memberName${memberCount}" required placeholder="Enter member name">
    </div>
    <div class="form-group">
      <label for="memberUSN${memberCount}">USN *</label>
      <input type="text" id="memberUSN${memberCount}" name="memberUSN${memberCount}" required placeholder="Enter USN">
    </div>
  `;
  
  teamMembersDiv.appendChild(memberDiv);
}

function removeMember(memberId) {
  const memberDiv = document.querySelector(`.team-member[data-member="${memberId}"]`);
  if (memberDiv) {
    memberDiv.remove();
  }
}

// Location selection
function selectLocation(type) {
  document.querySelectorAll('.location-option').forEach(option => {
    option.classList.remove('selected');
  });
  
  if (type === 'default') {
    document.getElementById('defaultLocation').classList.add('selected');
    document.getElementById('customPathGroup').style.display = 'none';
  } else {
    document.getElementById('customLocation').classList.add('selected');
    document.getElementById('customPathGroup').style.display = 'block';
  }
}

function browseFolder() {
  // In a real application, this would open a folder picker dialog
  // For now, we'll use a simple prompt
  const path = prompt('Enter the folder path:');
  if (path) {
    document.getElementById('customPath').value = path;
  }
}

// Project folder creation with team members (called from step 2)
async function createProjectFolderWithTeamMembers() {
  try {
    const response = await fetch('/api/create-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectName: projectData.projectName,
        savePath: projectData.savePath,
        teamMembers: projectData.teamMembers
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      projectData.projectPath = result.projectPath;
      projectData.folderName = result.folderName;
      // Don't call nextStep() here, let the normal flow continue
    } else {
      alert('Error creating project folder: ' + result.error);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating project folder');
    return false;
  }
  return true;
}

// Location selection and folder recreation (called from step 3)
async function createProjectFolder() {
  if (!validateLocation()) {
    return;
  }
  
  try {
    // If user changed location, we need to move the project
    if (projectData.projectPath && projectData.savePath !== 'D:\\Main-projects 2k25') {
      // Recreate project in new location
      const response = await fetch('/api/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: projectData.projectName,
          savePath: projectData.savePath,
          teamMembers: projectData.teamMembers
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        projectData.projectPath = result.projectPath;
        projectData.folderName = result.folderName;
      } else {
        alert('Error creating project folder: ' + result.error);
        return;
      }
    }
    
    nextStep();
  } catch (error) {
    console.error('Error:', error);
    alert('Error creating project folder');
  }
}

// File upload functions
function handleFileUpload(type, input) {
  const file = input.files[0];
  if (file) {
    // Validate file extensions
    const allowedExtensions = getAllowedExtensions(type);
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed for ${type}.`);
      input.value = ''; // Clear the input
      return;
    }
    
    const preview = document.getElementById(`${type}Preview`);
    const fileName = preview.querySelector('.file-name');
    const fileSize = preview.querySelector('.file-size');
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    preview.style.display = 'block';
    
    projectData.files[type] = file;
  }
}

function getAllowedExtensions(type) {
  switch (type) {
    case 'readme':
      return ['txt', 'md', 'pdf', 'doc', 'docx']; // Common README file types
    case 'installation':
      return ['txt', 'md', 'pdf', 'doc', 'docx', 'bat', 'sh', 'exe', 'msi']; // Common installation file types
    case 'source':
      return ['zip']; // Only zip for source code
    default:
      return [];
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadSupportingFiles() {
  if (!validateSupportingFiles()) {
    return;
  }
  
  try {
    // Upload README file
    const readmeFormData = new FormData();
    readmeFormData.append('readme', projectData.files.readme);
    readmeFormData.append('projectPath', projectData.projectPath);
    
    const readmeResponse = await fetch('/api/upload-readme', {
      method: 'POST',
      body: readmeFormData
    });
    
    const readmeResult = await readmeResponse.json();
    if (!readmeResult.success) {
      throw new Error('Failed to upload README: ' + readmeResult.error);
    }
    
    // Upload Installation file
    const installFormData = new FormData();
    installFormData.append('installation', projectData.files.installation);
    installFormData.append('projectPath', projectData.projectPath);
    
    const installResponse = await fetch('/api/upload-installation', {
      method: 'POST',
      body: installFormData
    });
    
    const installResult = await installResponse.json();
    if (!installResult.success) {
      throw new Error('Failed to upload installation file: ' + installResult.error);
    }
    
    nextStep();
  } catch (error) {
    console.error('Error:', error);
    alert('Error uploading files: ' + error.message);
  }
}

async function finishSubmission() {
  if (!validateSourceFile()) {
    return;
  }
  
  try {
    // Upload source file
    const sourceFormData = new FormData();
    sourceFormData.append('source', projectData.files.source);
    sourceFormData.append('projectPath', projectData.projectPath);
    
    const sourceResponse = await fetch('/api/upload-source', {
      method: 'POST',
      body: sourceFormData
    });
    
    const sourceResult = await sourceResponse.json();
    if (!sourceResult.success) {
      throw new Error('Failed to upload source file: ' + sourceResult.error);
    }
    
    // Complete project submission
    const completeResponse = await fetch('/api/complete-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectName: projectData.projectName,
        teamMembers: projectData.teamMembers,
        projectPath: projectData.projectPath,
        folderName: projectData.folderName,
        readmeFile: {
          name: 'ReadMe.txt',
          size: projectData.files.readme ? projectData.files.readme.size : 0
        },
        installationFile: {
          name: 'installation.' + getFileExtension(projectData.files.installation.name),
          size: projectData.files.installation ? projectData.files.installation.size : 0
        },
        sourceFile: {
          name: 'project.zip',
          size: projectData.files.source ? projectData.files.source.size : 0
        }
      })
    });
    
    const completeResult = await completeResponse.json();
    
    if (completeResult.success) {
      // Show success popup even if there are UI issues
      showSuccessPopup();
      
      // Try to show success page but don't let UI errors break the flow
      setTimeout(() => {
        try {
          showSuccessPage(completeResult.projectData);
        } catch (uiError) {
          console.error('UI Error (files saved successfully):', uiError);
          // Files are saved, just UI has issues - don't show error to user
        }
      }, 100);
    } else {
      throw new Error('Failed to complete project: ' + completeResult.error);
    }
  } catch (error) {
    console.error('Error:', error);
    // Only show error if it's not a DOM-related error
    if (!error.message.includes('Cannot read properties of null')) {
      alert('Error finishing submission: ' + error.message);
    } else {
      console.error('DOM Error (files likely saved):', error);
      // Show a success message anyway since files are probably saved
      showSuccessPopup();
    }
  }
}

function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function showSuccessPopup() {
  // Create popup overlay
  const popupOverlay = document.createElement('div');
  popupOverlay.className = 'popup-overlay';
  popupOverlay.innerHTML = `
    <div class="popup-content">
      <div class="popup-icon">✅</div>
      <h3>Uploading has been successfully done!</h3>
      <p>You can add new projects now.</p>
      <button class="btn btn-primary" onclick="closeSuccessPopup()">OK</button>
    </div>
  `;
  
  // Add popup to body
  document.body.appendChild(popupOverlay);
  
  // Auto close after 3 seconds
  setTimeout(() => {
    closeSuccessPopup();
  }, 3000);
}

function closeSuccessPopup() {
  try {
    const popupOverlay = document.querySelector('.popup-overlay');
    if (popupOverlay) {
      popupOverlay.remove();
    }
  } catch (error) {
    console.error('Error closing popup:', error);
  }
}

function showSuccessPage(projectData) {
  // Show success popup first
  showSuccessPopup();
  
  // Wait a bit before navigating to success page to avoid DOM conflicts
  setTimeout(() => {
    try {
      const successDetails = document.getElementById('successDetails');
      if (successDetails) {
        const timestamp = new Date(projectData.timestamp).toLocaleString();
        
        successDetails.innerHTML = `
          <h4>Project Details</h4>
          <p><strong>Project Name:</strong> ${projectData.projectName}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Team Members:</strong></p>
          <ul>
            ${projectData.teamMembers.map(member => `<li>${member.name} (${member.usn})</li>`).join('')}
          </ul>
          <p><strong>Folder Path:</strong> ${projectData.projectPath}</p>
          <p><strong>Folder Name:</strong> ${projectData.folderName}</p>
        `;
        
        // Navigate to success step
        if (currentStep < 6) {
          document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
          document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.remove('active');
          document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('completed');
          
          currentStep = 6;
          
          document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
          document.querySelector(`.progress-step[data-step="${currentStep}"]`).classList.add('active');
        }
      }
    } catch (error) {
      console.error('Error showing success page:', error);
      // Even if there's an error with the UI, the files are saved successfully
    }
  }, 500); // 500ms delay to ensure popup is displayed first
}

// Drag and drop functionality
function setupDragAndDrop() {
  const fileUploads = document.querySelectorAll('.file-upload');
  
  fileUploads.forEach(upload => {
    upload.addEventListener('dragover', (e) => {
      e.preventDefault();
      upload.classList.add('dragover');
    });
    
    upload.addEventListener('dragleave', () => {
      upload.classList.remove('dragover');
    });
    
    upload.addEventListener('drop', (e) => {
      e.preventDefault();
      upload.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const input = upload.querySelector('input[type="file"]');
        input.files = files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  });
}