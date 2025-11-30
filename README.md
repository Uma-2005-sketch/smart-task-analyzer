# ?? Smart Task Analyzer
# ?? Smart Task Analyzer

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
Visit: http://127.0.0.1:8000/

Algorithm Explanation
The priority scoring algorithm uses a weighted multi-factor approach that considers four key dimensions: urgency, importance, effort, and dependencies. Each task receives a score between 0-1 calculated using configurable weights for different prioritization strategies.

Scoring Formula
Total Score = (Urgency x W_urgency) + (Importance x W_importance) + (Effort x W_effort) + (Dependencies x W_dependencies)

Urgency: Calculated based on due date proximity. Tasks due today receive 0.9, overdue tasks get exponentially higher scores up to 1.0, while distant deadlines decay exponentially. This ensures time-sensitive tasks get immediate attention.

Importance: User-provided rating (1-10 scale) normalized to 0-1. Higher importance tasks receive proportionally higher scores, ensuring strategic alignment with user priorities.

Effort: Uses inverse relationship - lower effort tasks get higher scores. Quick tasks (ó1 hour) score 1.0, while time-consuming tasks (ò8 hours) receive diminishing returns. This promotes "quick wins" and prevents procrastination.

Dependencies: Tasks blocking other tasks receive priority boosts. Each dependent task adds 0.2 to the score, encouraging resolution of bottlenecks in the workflow. Tasks with no dependencies receive a neutral 0.5 score.

Strategies: Four configurable approaches - Smart Balance (balanced weights), Fastest Wins (effort-focused), High Impact (importance-focused), and Deadline Driven (urgency-focused). Each strategy adjusts the weights to match different productivity philosophies.

Design Decisions
RESTful API Architecture: Chose Django REST Framework for clean separation between frontend and backend, enabling future mobile app development and easier testing.

Strategy Pattern Implementation: Used configurable scoring weights to allow different prioritization approaches without code changes, making the algorithm flexible for various user preferences.

Client-Side Graph Visualization: Implemented D3.js for dependency graphs instead of server-side rendering to provide interactive, real-time visualizations without page reloads.

Trade-offs: Used SQLite for development simplicity over PostgreSQL, accepting scalability limits for faster setup. Frontend uses vanilla JavaScript instead of React to reduce dependencies and complexity.

Time Breakdown
Project Setup & Planning: 45 minutes

Backend Development: 2 hours (Django setup, models, API endpoints, scoring algorithm)

Frontend Development: 1.5 hours (UI design, JavaScript functionality, form handling)

Bonus Features: 1.5 hours (Eisenhower Matrix, Dependency Graph, AI Insights, Unit Tests)

Testing & Documentation: 45 minutes

Total Development Time: ~6 hours

Bonus Challenges
? All bonus challenges implemented:

Eisenhower Matrix View with visual task categorization

Dependency Graph Visualization with circular dependency detection

Comprehensive Unit Tests (12 tests covering all functionality)

Enhanced Date Intelligence considering working days

AI Productivity Insights with workload analytics

Future Improvements
With more time, I would implement:

User Authentication & Multi-tenancy for personal task spaces

Real-time Collaboration using WebSockets for team usage

Machine Learning to adapt scoring based on completion patterns

Calendar Integration with Google Calendar/Outlook sync

Mobile Application using React Native

Advanced Analytics with historical trends and productivity insights

Export Functionality for reports and data sharing 