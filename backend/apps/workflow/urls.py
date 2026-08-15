from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProposalViewSet, ProposalVendorQuotationViewSet, ProposalAmendmentViewSet,
    ApprovalChainTemplateViewSet, ApprovalStepViewSet
)

router = DefaultRouter()
router.register(r'proposals', ProposalViewSet)
router.register(r'quotations', ProposalVendorQuotationViewSet)
router.register(r'amendments', ProposalAmendmentViewSet)
router.register(r'templates', ApprovalChainTemplateViewSet)
router.register(r'steps', ApprovalStepViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
