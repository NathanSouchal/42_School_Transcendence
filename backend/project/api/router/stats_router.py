from django.urls import path
from api.views import StatsView

urlpatterns = [
	path('<uuid:id>/', StatsView.as_view(), name = 'StatsView')
]
