from django.test import TestCase
from datetime import date, timedelta
from .scoring import TaskScorer, detect_circular_dependencies

class TaskScoringTests(TestCase):
    
    def setUp(self):
        self.sample_tasks = [
            {
                "id": "1",
                "title": "Urgent Important Task",
                "due_date": date.today(),
                "estimated_hours": 2,
                "importance": 9,
                "dependencies": []
            },
            {
                "id": "2",
                "title": "Future Task", 
                "due_date": date.today() + timedelta(days=30),
                "estimated_hours": 8,
                "importance": 6,
                "dependencies": ["1"]
            }
        ]
    
    def test_urgency_score_today(self):
        scorer = TaskScorer()
        score = scorer.calculate_urgency_score(date.today())
        self.assertGreaterEqual(score, 0.8)
        self.assertLessEqual(score, 1.0)
    
    def test_urgency_score_past_due(self):
        scorer = TaskScorer()
        past_date = date.today() - timedelta(days=5)
        score = scorer.calculate_urgency_score(past_date)
        self.assertGreaterEqual(score, 0.8)
    
    def test_importance_score_normalization(self):
        scorer = TaskScorer()
        self.assertEqual(scorer.calculate_importance_score(10), 1.0)
        self.assertEqual(scorer.calculate_importance_score(5), 0.5)
        self.assertEqual(scorer.calculate_importance_score(1), 0.1)
    
    def test_effort_score_quick_task(self):
        scorer = TaskScorer()
        score = scorer.calculate_effort_score(1)
        self.assertEqual(score, 1.0)
    
    def test_effort_score_long_task(self):
        scorer = TaskScorer()
        score = scorer.calculate_effort_score(20)
        self.assertLess(score, 0.3)
    
    def test_dependency_score_no_dependencies(self):
        scorer = TaskScorer()
        score = scorer.calculate_dependency_score([], self.sample_tasks)
        self.assertEqual(score, 0.5)

    def test_dependency_score_with_dependencies(self):
    	scorer = TaskScorer()
    	score = scorer.calculate_dependency_score(["1"], self.sample_tasks)
    	# With the updated calculation, score should be at least 0.5
    	self.assertGreaterEqual(score, 0.5) 

    
    def test_total_score_calculation(self):
        scorer = TaskScorer()
        task = self.sample_tasks[0]
        score, explanation = scorer.calculate_total_score(task, self.sample_tasks)
        
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 1.0)
        self.assertIsInstance(explanation, str)
        self.assertIn("score:", explanation)
    
    def test_different_strategies(self):
        strategies = ["smart_balance", "fastest_wins", "high_impact", "deadline_driven"]
        
        for strategy in strategies:
            scorer = TaskScorer(strategy)
            task = self.sample_tasks[0]
            score, _ = scorer.calculate_total_score(task, self.sample_tasks)
            
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)
    
    def test_circular_dependencies_detection(self):
        # No circular dependencies
        tasks_no_circular = [
            {"id": "1", "dependencies": ["2"]},
            {"id": "2", "dependencies": []}
        ]
        self.assertFalse(detect_circular_dependencies(tasks_no_circular))
        
        # Circular dependencies
        tasks_circular = [
            {"id": "1", "dependencies": ["2"]},
            {"id": "2", "dependencies": ["1"]}
        ]
        self.assertTrue(detect_circular_dependencies(tasks_circular))
    
    def test_edge_cases(self):
        scorer = TaskScorer()
        
        # Test with minimum values
        task_min = {
            "id": "min",
            "due_date": date.today(),
            "estimated_hours": 0.5,
            "importance": 1,
            "dependencies": []
        }
        score_min, _ = scorer.calculate_total_score(task_min, [task_min])
        self.assertGreaterEqual(score_min, 0.0)
        
        # Test with maximum values  
        task_max = {
            "id": "max", 
            "due_date": date.today() + timedelta(days=365),
            "estimated_hours": 100,
            "importance": 10,
            "dependencies": []
        }
        score_max, _ = scorer.calculate_total_score(task_max, [task_max])
        self.assertLessEqual(score_max, 1.0)

class TaskModelTests(TestCase):
    def test_task_creation(self):
        from .models import Task
        task = Task.objects.create(
            title="Test Task",
            due_date=date.today(),
            estimated_hours=5.0,
            importance=8,
            dependencies=["1", "2"]
        )
        self.assertEqual(task.title, "Test Task")
        self.assertEqual(task.importance, 8)
        self.assertEqual(len(task.dependencies), 2)