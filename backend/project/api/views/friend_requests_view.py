from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.shortcuts import get_object_or_404
from api.models import FriendRequest, User
from api.serializers import FriendRequestSerializer, UserSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.http import Http404
from django.db import IntegrityError

class FriendRequestView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id=None):
        try:
            friendrequest = get_object_or_404(FriendRequest, id=id)
            serialized = FriendRequestSerializer(friendrequest)
            return Response({'stats': serialized.data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, id=None):
        try:
            friendrequest = get_object_or_404(FriendRequest, id=id)
            serialized = FriendRequestSerializer(friendrequest, data=request.data, partial=True)
            if serialized.is_valid():
                if serialized.validated_data['accepted'] is True:
                    friendrequest.accept()
                    data = FriendRequestSerializer(friendrequest).data
                    friendrequest.delete()
                    return Response({'friend request': data, 'message': f'friend request with id {id} has been accepted.'}, status=status.HTTP_200_OK)
                elif serialized.validated_data['accepted'] is False:
                    data = FriendRequestSerializer(friendrequest).data
                    friendrequest.decline()
                    return Response({'friend request': data, 'message': f'friend request with id {id} has been declined.'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': "Accepted field must be true or false"}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'errors': serialized.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({'error': 'friend request not found'}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            serialized = FriendRequestSerializer(data=request.data)
            if serialized.is_valid():
                friendrequest = serialized.save()
                return Response({'friend request': FriendRequestSerializer(friendrequest).data, 'message': 'Friend request created successfully.'}, status=status.HTTP_201_CREATED)
            return Response({'errors': serialized.errors}, status=status.HTTP_400_BAD_REQUEST)
        except DRFValidationError as e:
            return Response({'errors': e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response({'error': 'Friend request already exists.'}, status=status.HTTP_409_CONFLICT)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestsByUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id=None):
        try:
            user = get_object_or_404(User, id=id)
            sent_friend_requests = FriendRequest.objects.filter(from_user=user, accepted=False)
            received_friend_requests = FriendRequest.objects.filter(to_user=user, accepted=False)
            pending_friend_requests = sent_friend_requests | received_friend_requests.order_by('-created_at')
            serialized = FriendRequestSerializer(pending_friend_requests, many=True)
            friends = UserSerializer(user)
            return Response({'friends': friends.data['friends'], 'pending_friend_requests': serialized.data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
