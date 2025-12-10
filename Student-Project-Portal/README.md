# Student Project Submission Portal

A comprehensive web application for students to submit academic projects with multi-step form, file uploads, and search functionality.

## Features

### 🎯 Core Functionality
- **Multi-step submission form** with progress tracking
- **Automatic folder creation** with GitHub-like structure
- **File upload support** for README, installation instructions, and source code
- **Search functionality** to find submitted projects
- **Metadata storage** in JSON format

### 📁 Folder Structure
Projects are saved in the following format:
```
project-2025/
└── ProjectName_YYYY-MM-DD_HH-mm-ss/
    ├── README/
    │   └── ReadMe.txt
    ├── INSTALLATION/
    │   └── installation.pdf
    ├── SOURCE/
    │   └── project.zip
    ├── student-info.txt
    └── project-info.json
```

### 🧭 Multi-Step Form
1. **Project Name** - Enter project title
2. **Team Members** - Add multiple team members with names and USNs
3. **Location Selection** - Choose default or custom save location
4. **Supporting Files** - Upload README and installation instructions
5. **Source Code** - Upload main project ZIP file
6. **Success Page** - View submission details

### 📝 Student Information
- Automatically creates `student-info.txt` file with all team member details
- Format: Each student's name and USN on separate lines
- Stored in project folder for easy reference

### 🔍 Search Features
- Search by project name, team member name, USN, or timestamp
- View all submitted projects
- Access project folders and details

## Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Default Configuration

- **Default Save Location**: `project-2025/` (in application directory)
- **Server Port**: 3000
- **Database**: `data/projects.json`
- **Upload Temp Folder**: `uploads/temp`

## API Endpoints

### Project Management
- `POST /api/create-project` - Create project folder structure
- `POST /api/complete-project` - Save project metadata and complete submission

### File Uploads
- `POST /api/upload-readme` - Upload README.txt file
- `POST /api/upload-installation` - Upload installation instructions
- `POST /api/upload-source` - Upload source code ZIP

### Search & Retrieval
- `GET /api/projects` - Get all submitted projects
- `GET /api/search` - Search projects by query and type

## File Upload Requirements

- **README**: .txt files only
- **Installation**: .txt, .pdf, .docx files
- **Source Code**: .zip files only
- **Maximum file size**: 50MB per file

### 🔍 Search Features
- Search by project name, team member name, USN, or timestamp
- View all submitted projects
- Access project folders and details
- Download individual files or entire project
- Student information automatically included in search results

## UI Features

- **Modern gradient design** with blue/purple theme
- **Responsive layout** for mobile and desktop
- **Smooth animations** and transitions
- **Progress indicator** for multi-step form
- **Drag-and-drop** file upload support
- **Interactive hover effects**

## Security Notes

- File uploads are validated for type and size
- Paths are sanitized to prevent directory traversal
- All data is stored locally on the server

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
