import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface ReviewSubmission {
  bookingId: string;
  rating: number;
  comment?: string;
  fromAddress: string;
  toAddress: string;
  customerId?: string;
}

interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  fromAddress: string;
  toAddress: string;
  customerId?: string;
  createdAt: string;
}

class ReviewService {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient<Database>();
  }

  async submitReview(data: ReviewSubmission) {
    try {
      if (!data.bookingId || !data.rating) {
        throw new Error('Missing required fields: bookingId and rating are required');
      }

      console.log('Submitting review with data:', data);

      // Kontrollera om recensionen redan finns
      const { data: existingReview, error: existingError } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', data.bookingId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing review:', existingError);
        throw existingError;
      }

      if (existingReview) {
        console.log('Review already exists, updating instead');
        return this.updateReview(existingReview.id, data);
      }

      // Skapa ny recension
      const { data: review, error: insertError } = await this.supabase
        .from('reviews')
        .insert([
          {
            booking_id: data.bookingId,
            rating: data.rating,
            comment: data.comment || '',
            from_address: data.fromAddress,
            to_address: data.toAddress,
            customer_id: data.customerId,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting review:', insertError);
        throw insertError;
      }

      if (!review) {
        throw new Error('No review data returned after insert');
      }

      console.log('Review submitted successfully:', review);

      // Uppdatera follow_up status om det finns
      const { error: followUpError } = await this.supabase
        .from('follow_ups')
        .update({ 
          status: 'received',
          review_sent_at: new Date().toISOString()
        })
        .eq('booking_id', data.bookingId)
        .is('review_sent_at', null);

      if (followUpError) {
        console.error('Error updating follow-up:', followUpError);
        // Fortsätt även om follow-up uppdateringen misslyckas
      }

      return { success: true, data: review };
    } catch (error) {
      console.error('Error in submitReview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async getReview(bookingId: string): Promise<Review | null> {
    try {
      if (!bookingId) {
        throw new Error('bookingId is required');
      }

      console.log('Fetching review for booking:', bookingId);
      
      const { data, error } = await this.supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Ingen recension hittades
          return null;
        }
        console.error('Error fetching review:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getReview:', error);
      return null;
    }
  }

  async updateReview(reviewId: string, updates: Partial<ReviewSubmission>) {
    try {
      if (!reviewId) {
        throw new Error('reviewId is required');
      }

      console.log('Updating review:', reviewId, updates);
      
      const { data, error } = await this.supabase
        .from('reviews')
        .update({
          rating: updates.rating,
          comment: updates.comment,
          from_address: updates.fromAddress,
          to_address: updates.toAddress,
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No review data returned after update');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateReview:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const reviewService = new ReviewService(); 