from datetime import date, timedelta
import math

class TaskScorer:
    def __init__(self, strategy="smart_balance"):
        self.strategy = strategy
        self.weights = self._get_strategy_weights(strategy)
    
    def _get_strategy_weights(self, strategy):
        strategies = {
            "fastest_wins": {"urgency": 0.2, "importance": 0.3, "effort": 0.4, "dependencies": 0.1},
            "high_impact": {"urgency": 0.2, "importance": 0.6, "effort": 0.1, "dependencies": 0.1},
            "deadline_driven": {"urgency": 0.6, "importance": 0.2, "effort": 0.1, "dependencies": 0.1},
            "smart_balance": {"urgency": 0.35, "importance": 0.35, "effort": 0.2, "dependencies": 0.1}
        }
        return strategies.get(strategy, strategies["smart_balance"])
    
    def calculate_urgency_score(self, due_date, today=None):
        if today is None:
            today = date.today()
        
        days_until_due = (due_date - today).days
        
        if days_until_due < 0:
            # Past due - high urgency with exponential increase
            return min(1.0, 0.8 + abs(days_until_due) * 0.05)
        elif days_until_due == 0:
            return 0.9  # Due today
        elif days_until_due <= 1:
            return 0.8  # Due tomorrow
        elif days_until_due <= 3:
            return 0.7  # Due in 3 days
        elif days_until_due <= 7:
            return 0.5  # Due in a week
        else:
            # Exponential decay for further dates
            return max(0.1, 1.0 / (1.0 + math.log(days_until_due - 6)))
    
    def calculate_importance_score(self, importance):
        # Normalize 1-10 scale to 0-1
        return importance / 10.0
    
    def calculate_effort_score(self, estimated_hours):
        # Lower effort = higher score (quick wins)
        if estimated_hours <= 1:
            return 1.0
        elif estimated_hours <= 4:
            return 0.8
        elif estimated_hours <= 8:
            return 0.5
        else:
            return max(0.1, 1.0 / math.sqrt(estimated_hours))
    
    def calculate_dependency_score(self, dependencies, all_tasks):
        if not dependencies:
            return 0.5  # Neutral score for no dependencies
        
        # Tasks that block others get higher priority
        blocking_count = 0
        for task in all_tasks:
            if any(dep in task.get('dependencies', []) for dep in dependencies):
                blocking_count += 1
        
        # Increased base score and multiplier to ensure score > 0.5 when blocking
        return min(1.0, 0.5 + (blocking_count * 0.2))
    
    def calculate_total_score(self, task, all_tasks, today=None):
        if today is None:
            today = date.today()
        
        urgency_score = self.calculate_urgency_score(task['due_date'], today)
        importance_score = self.calculate_importance_score(task['importance'])
        effort_score = self.calculate_effort_score(task['estimated_hours'])
        dependency_score = self.calculate_dependency_score(task.get('dependencies', []), all_tasks)
        
        # Calculate weighted score
        total_score = (
            urgency_score * self.weights['urgency'] +
            importance_score * self.weights['importance'] +
            effort_score * self.weights['effort'] +
            dependency_score * self.weights['dependencies']
        )
        
        # Generate explanation
        explanation = self._generate_explanation(
            urgency_score, importance_score, effort_score, dependency_score, total_score
        )
        
        return round(total_score, 3), explanation
    
    def _generate_explanation(self, urgency, importance, effort, dependencies, total_score):
        factors = []
        
        if urgency > 0.7:
            factors.append("urgent deadline")
        elif urgency < 0.3:
            factors.append("distant deadline")
            
        if importance > 0.7:
            factors.append("high importance")
        elif importance < 0.3:
            factors.append("low importance")
            
        if effort > 0.7:
            factors.append("quick task")
        elif effort < 0.3:
            factors.append("time-consuming")
            
        if dependencies > 0.7:
            factors.append("blocks other tasks")
        elif dependencies < 0.3:
            factors.append("no dependencies")
        
        if not factors:
            factors.append("balanced factors")
            
        return f"Priority due to: {', '.join(factors)} (score: {total_score:.3f})"

def detect_circular_dependencies(tasks):
    """Detect circular dependencies in tasks"""
    graph = {}
    for task in tasks:
        graph[task['id']] = task.get('dependencies', [])
    
    def has_cycle(node, visited, recursion_stack):
        visited.add(node)
        recursion_stack.add(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in graph:
                continue  # Skip if dependency doesn't exist
            if neighbor not in visited:
                if has_cycle(neighbor, visited, recursion_stack):
                    return True
            elif neighbor in recursion_stack:
                return True
        
        recursion_stack.remove(node)
        return False
    
    visited = set()
    for node in graph:
        if node not in visited:
            if has_cycle(node, visited, set()):
                return True
    return False

def generate_dependency_graph(tasks):
    """
    Generate data for dependency graph visualization
    """
    nodes = []
    links = []
    
    for task in tasks:
        nodes.append({
            "id": task['id'],
            "name": task['title'],
            "importance": task['importance'],
            "due_date": task['due_date'].isoformat() if hasattr(task['due_date'], 'isoformat') else task['due_date']
        })
        
        for dep_id in task.get('dependencies', []):
            links.append({
                "source": dep_id,
                "target": task['id'],
                "type": "depends_on"
            })
    
    return {
        "nodes": nodes,
        "links": links
    }