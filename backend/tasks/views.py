from datetime import date, timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from .scoring import TaskScorer, detect_circular_dependencies
from .serializers import TaskSerializer
import json

@api_view(['POST'])
def analyze_tasks(request):
    """
    Analyze and score a list of tasks based on the selected strategy
    """
    try:
        # Get tasks from request data
        tasks_data = request.data
        
        if not isinstance(tasks_data, list):
            return Response(
                {"error": "Expected a list of tasks"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate required fields and data types
        for task in tasks_data:
            if not all(key in task for key in ['title', 'due_date', 'estimated_hours', 'importance']):
                return Response(
                    {"error": "Each task must have title, due_date, estimated_hours, and importance"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert due_date string to date object if needed
            if isinstance(task['due_date'], str):
                task['due_date'] = date.fromisoformat(task['due_date'])
        
        # Check for circular dependencies
        if detect_circular_dependencies(tasks_data):
            return Response(
                {"error": "Circular dependencies detected in tasks"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get scoring strategy from request
        strategy = request.data.get('strategy', 'smart_balance')
        valid_strategies = ['smart_balance', 'fastest_wins', 'high_impact', 'deadline_driven']
        if strategy not in valid_strategies:
            strategy = 'smart_balance'
        
        # Initialize scorer and calculate scores
        scorer = TaskScorer(strategy)
        today = date.today()
        
        scored_tasks = []
        for task in tasks_data:
            score, explanation = scorer.calculate_total_score(task, tasks_data, today)
            task['priority_score'] = score
            task['explanation'] = explanation
            scored_tasks.append(task)
        
        # Sort tasks by priority score (descending)
        sorted_tasks = sorted(scored_tasks, key=lambda x: x['priority_score'], reverse=True)
        
        return Response({
            "strategy_used": strategy,
            "tasks": sorted_tasks,
            "total_tasks": len(sorted_tasks)
        })
        
    except ValueError as e:
        return Response(
            {"error": f"Invalid date format: {str(e)}. Use YYYY-MM-DD format."},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def suggest_tasks(request):
    """
    Suggest top 3 tasks to work on today with explanations
    """
    try:
        # In a real app, this would get tasks from database
        # For now, we'll use sample data or get from request params
        sample_tasks = [
            {
                "id": "1",
                "title": "Complete project proposal",
                "due_date": date.today().isoformat(),
                "estimated_hours": 4,
                "importance": 9,
                "dependencies": []
            },
            {
                "id": "2", 
                "title": "Fix critical bug",
                "due_date": (date.today() + timedelta(days=1)).isoformat(),
                "estimated_hours": 2,
                "importance": 10,
                "dependencies": []
            },
            {
                "id": "3",
                "title": "Write documentation",
                "due_date": (date.today() + timedelta(days=7)).isoformat(),
                "estimated_hours": 3,
                "importance": 6,
                "dependencies": []
            }
        ]
        
        # Convert date strings to date objects
        for task in sample_tasks:
            if isinstance(task['due_date'], str):
                task['due_date'] = date.fromisoformat(task['due_date'])
        
        # Score and sort tasks
        scorer = TaskScorer('smart_balance')
        today = date.today()
        
        scored_tasks = []
        for task in sample_tasks:
            score, explanation = scorer.calculate_total_score(task, sample_tasks, today)
            task['priority_score'] = score
            task['explanation'] = explanation
            scored_tasks.append(task)
        
        # Get top 3 tasks
        top_tasks = sorted(scored_tasks, key=lambda x: x['priority_score'], reverse=True)[:3]
        
        # Generate suggestions with detailed explanations
        suggestions = []
        for i, task in enumerate(top_tasks, 1):
            suggestions.append({
                "rank": i,
                "task": task['title'],
                "priority_score": task['priority_score'],
                "reason": task['explanation'],
                "due_date": task['due_date'].isoformat(),
                "estimated_hours": task['estimated_hours'],
                "importance": task['importance']
            })
        
        return Response({
            "date": today.isoformat(),
            "suggestions": suggestions,
            "strategy": "smart_balance"
        })
        
    except Exception as e:
        return Response(
            {"error": f"Server error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def eisenhower_matrix(request):
    """
    Display tasks on Eisenhower Matrix (Urgent vs Important)
    """
    try:
        # Sample data - in real app, this would come from database
        sample_tasks = [
            {
                "id": "1", "title": "Critical bug fix", "due_date": date.today(),
                "estimated_hours": 2, "importance": 9, "dependencies": []
            },
            {
                "id": "2", "title": "Long-term planning", "due_date": date.today() + timedelta(days=30),
                "estimated_hours": 4, "importance": 8, "dependencies": []
            },
            {
                "id": "3", "title": "Team meeting", "due_date": date.today(),
                "estimated_hours": 1, "importance": 5, "dependencies": []
            },
            {
                "id": "4", "title": "Learn new technology", "due_date": date.today() + timedelta(days=60), 
                "estimated_hours": 10, "importance": 7, "dependencies": []
            }
        ]
        
        # Convert date strings if needed
        for task in sample_tasks:
            if isinstance(task['due_date'], str):
                task['due_date'] = date.fromisoformat(task['due_date'])
        
        # Categorize tasks into Eisenhower Matrix quadrants
        today = date.today()
        urgent_threshold = timedelta(days=3)
        
        matrix = {
            "do_first": [],      # Urgent & Important
            "schedule": [],      # Important & Not Urgent  
            "delegate": [],      # Urgent & Not Important
            "eliminate": []      # Not Urgent & Not Important
        }
        
        for task in sample_tasks:
            days_until_due = (task['due_date'] - today).days
            is_urgent = days_until_due <= urgent_threshold.days
            is_important = task['importance'] >= 7
            
            if is_urgent and is_important:
                matrix["do_first"].append(task)
            elif not is_urgent and is_important:
                matrix["schedule"].append(task)
            elif is_urgent and not is_important:
                matrix["delegate"].append(task)
            else:
                matrix["eliminate"].append(task)
        
        return Response({
            "matrix": matrix,
            "urgent_threshold_days": urgent_threshold.days,
            "importance_threshold": 7
        })
        
    except Exception as e:
        return Response(
            {"error": f"Matrix generation failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def dependency_graph(request):
    """
    Generate dependency graph data for visualization
    """
    try:
        tasks_data = request.data
        
        if not isinstance(tasks_data, list):
            return Response(
                {"error": "Expected a list of tasks"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert date strings if needed
        for task in tasks_data:
            if isinstance(task['due_date'], str):
                task['due_date'] = date.fromisoformat(task['due_date'])
        
        from .scoring import generate_dependency_graph, detect_circular_dependencies
        
        # Check for circular dependencies
        circular_deps = detect_circular_dependencies(tasks_data)
        
        graph_data = generate_dependency_graph(tasks_data)
        
        return Response({
            "graph": graph_data,
            "has_circular_deps": circular_deps
        })
        
    except Exception as e:
        return Response(
            {"error": f"Graph generation failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )