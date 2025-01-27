from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from django.shortcuts import get_object_or_404
from api.models import Friendship, User
from api.serializers import FriendshipSerializer, UserSerializer
from api.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.http import Http404


class FriendshipView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id=None):
        try:
            # if not request.user.is_superuser:
            # 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
            friendship = get_object_or_404(Friendship, id=id)
            serialized = FriendshipSerializer(friendship)
            return Response({'stats': serialized.data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'Friendship not found.'}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, id=None):
        try:
			# if not request.user.is_superuser:
			# 	return Response({'error': 'You don\'t have the rights'}, status=status.HTTP_403_FORBIDDEN)
            friendship = get_object_or_404(Friendship, id=id)
            serialized = FriendshipSerializer(friendship, data=request.data, partial=True)
            if serialized.is_valid():
                if serialized.validated_data['accepted'] is True:
                    friendship.accept()
                    return Response({'friendship': FriendshipSerializer(friendship).data, 'message': f'friendship with id {id} has been accepted.'}, status=status.HTTP_200_OK)
                else :
                    friendship.decline()
                    return Response({'friendship': FriendshipSerializer(friendship).data, 'message': f'friendship with id {id} has been declined.'}, status=status.HTTP_200_OK)
            return Response({'errors': serialized.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Http404:
            return Response({'error': 'Friendship not found.'}, status=status.HTTP_404_NOT_FOUND)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendshipListView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            print(f"coucou {request.data}")
            serialized = FriendshipSerializer(data=request.data)
            if serialized.is_valid():
                friendship = serialized.save()
                return Response({'friendship': FriendshipSerializer(friendship).data, 'message': 'Friendship created successfully.'}, status=status.HTTP_201_CREATED)
            return Response({'errors': serialized.errors}, status=status.HTTP_400_BAD_REQUEST)
        except AuthenticationFailed as auth_error:
            return Response({'error': 'Invalid or expired access token. Please refresh your token or reauthenticate.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendshipByUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id=None):
        try:
            user = get_object_or_404(User, id=id)
            sent_friendships = Friendship.objects.filter(from_user=user, accepted=False)
            received_friendships = Friendship.objects.filter(to_user=user, accepted=False)
            pending_friendships = sent_friendships | received_friendships.order_by('-created_at')
            serialized = FriendshipSerializer(pending_friendships, many=True)
            friends = UserSerializer(user)
            return Response({'friends': friends.data['friends'], 'pending_friendships': serialized.data}, status=status.HTTP_200_OK)
        except Http404:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
