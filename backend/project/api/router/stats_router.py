from django.urls import path
from api.views import StatsView

urlpatterns = [
	path('<int:id>/', StatsView.as_view(), name = 'StatsView')
]