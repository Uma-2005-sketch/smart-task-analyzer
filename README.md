# 🎯 Smart Task Analyzer

An intelligent task management system that uses advanced algorithms to prioritize tasks based on multiple factors including urgency, importance, effort, and dependencies.

## Features

- Smart priority scoring with 4 strategies
- Eisenhower Matrix visualization  
- Interactive dependency graphs
- AI productivity insights
- Comprehensive unit tests

## Technology Stack

- **Backend**: Django, Django REST Framework
- **Frontend**: JavaScript, HTML5, CSS3, D3.js
- **Database**: SQLite

## Quick Start

```bash
# Clone repository
git clone https://github.com/Uma-2005-sketch/smart-task-analyzer.git
cd smart-task-analyzer

# Setup environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run application
cd backend
python manage.py migrate
python manage.py runserver
