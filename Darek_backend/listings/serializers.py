# listings/serializers.py
from rest_framework import serializers
from .models import Campus, Listing, ListingImage, Review, RoommatePost

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = '__all__'

class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ('id', 'image')

class ReviewSerializer(serializers.ModelSerializer):
    author_email = serializers.ReadOnlyField(source='author.email')

    class Meta:
        model = Review
        fields = ('id', 'author_email', 'listing', 'rating', 'comment', 'created_at')
        read_only_fields = ('author',)

class ListingSerializer(serializers.ModelSerializer):
    owner_email = serializers.ReadOnlyField(source='owner.email')
    images = ListingImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = '__all__'
        read_only_fields = ('owner',)

class RoommatePostSerializer(serializers.ModelSerializer):
    author_email = serializers.ReadOnlyField(source='author.email')

    class Meta:
        model = RoommatePost
        fields = '__all__'
        read_only_fields = ('author',)