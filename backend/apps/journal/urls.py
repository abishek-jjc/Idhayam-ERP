from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JournalEntryViewSet, StockViewSet

router = DefaultRouter()
router.register(r'entries', JournalEntryViewSet)
router.register(r'stocks', StockViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
