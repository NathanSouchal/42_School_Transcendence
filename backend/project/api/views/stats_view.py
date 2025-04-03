from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import Stats, User
from api.serializers import StatsSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.http import Http404
from django.db import IntegrityError


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id=None):
        try:
            user = get_object_or_404(User, id=id)
            stats = Stats.objects.get(user=user)
            serialized = StatsSerializer(stats)
            return Response({'stats': serialized.data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, id=None):
        try:
            serializer = StatsSerializer(data=request.data)
            if serializer.is_valid():
                stats = serializer.save()
                return Response({'stats': StatsSerializer(stats).data, 'message': 'Stats created successfully.'}, status=status.HTTP_201_CREATED)
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({'error': 'Request already made.'}, status=status.HTTP_409_CONFLICT)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
