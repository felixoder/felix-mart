import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Upload, X, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  review_images?: {
    id: string;
    image_url: string;
    alt_text?: string;
  }[];
}

interface ReviewSectionProps {
  productId: string;
  user: SupabaseUser | null;
}

export const ReviewSection = ({ productId, user }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
    images: [] as File[]
  });
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("product_reviews")
        .select(`
          *,
          profiles (
            full_name,
            email
          ),
          review_images (
            id,
            image_url,
            alt_text
          )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(reviewsData || []);
      
      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / reviewsData.length);
        setTotalReviews(reviewsData.length);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setReviewForm(prev => ({
        ...prev,
        images: [...prev.images, ...imageFiles].slice(0, 5) // Max 5 images
      }));
    }
  };

  const removeImage = (index: number) => {
    setReviewForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (reviewId: string) => {
    const uploadPromises = reviewForm.images.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reviewId}-${Date.now()}.${fileExt}`;
      const filePath = `review-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Save image record to database
      const { error: dbError } = await supabase
        .from('review_images')
        .insert({
          review_id: reviewId,
          image_url: publicUrl,
          alt_text: `Review image for ${file.name}`
        });

      if (dbError) throw dbError;

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (reviewForm.rating === 0 || !reviewForm.comment.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a rating and comment",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert review
      const { data: reviewData, error: reviewError } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || null,
          comment: reviewForm.comment.trim()
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Upload images if any
      if (reviewForm.images.length > 0) {
        await uploadImages(reviewData.id);
      }

      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });

      // Reset form
      setReviewForm({
        rating: 0,
        title: "",
        comment: "",
        images: []
      });
      setShowReviewForm(false);

      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, size = "h-4 w-4") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setReviewForm(prev => ({ ...prev, rating: star }))}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${size} ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded animate-pulse"></div>
        <div className="h-32 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">Customer Reviews</h3>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2">
              {renderStars(averageRating)}
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} out of 5 ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        
        {user && (
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant={showReviewForm ? "outline" : "default"}
          >
            {showReviewForm ? "Cancel" : "Write a Review"}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              {renderStars(reviewForm.rating, true, "h-6 w-6")}
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Title (Optional)</Label>
              <Input
                id="review-title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief summary of your review"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-comment">Your Review *</Label>
              <Textarea
                id="review-comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your thoughts about this product..."
                className="min-h-24"
                maxLength={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Add Photos (Optional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('review-images')?.click()}
                  disabled={reviewForm.images.length >= 5}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
                <span className="text-sm text-muted-foreground">
                  {reviewForm.images.length}/5 images
                </span>
              </div>
              <input
                id="review-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {reviewForm.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {reviewForm.images.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || reviewForm.rating === 0 || !reviewForm.comment.trim()}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {review.profiles?.full_name || 'Anonymous User'}
                        </span>
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-medium">{review.title}</h4>
                  )}

                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {review.comment}
                  </p>

                  {review.review_images && review.review_images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.review_images.map((image) => (
                        <img
                          key={image.id}
                          src={image.image_url}
                          alt={image.alt_text || 'Review image'}
                          className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(image.image_url, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
