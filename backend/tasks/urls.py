from django.urls import path
from . import views

urlpatterns = [
    path('tasks/analyze/', views.analyze_tasks, name='analyze-tasks'),
    path('tasks/suggest/', views.suggest_tasks, name='suggest-tasks'),
    path('tasks/eisenhower/', views.eisenhower_matrix, name='eisenhower-matrix'),
    path('tasks/dependency-graph/', views.dependency_graph, name='dependency-graph'),
]