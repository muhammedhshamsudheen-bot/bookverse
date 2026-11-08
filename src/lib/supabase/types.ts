export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "author" | "admin";
export type AuthorApplicationStatus = "pending" | "approved" | "rejected";
export type BookAccessType = "free" | "premium" | "paid";
export type BookPublicationStatus = "draft" | "pending" | "published" | "rejected" | "archived";
export type AuthorSubmissionStatus = "submitted" | "under_review" | "revisions_requested" | "approved" | "rejected";
export type PurchaseStatus = "pending" | "completed" | "refunded" | "failed";
export type SubscriptionPlan = "plus_monthly" | "plus_annual" | "patron_monthly";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type TransactionType = "book_purchase" | "subscription" | "author_royalty_payout";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          profile_image: string | null;
          phone_number: string | null;
          preferred_language: string;
          account_status: "active" | "suspended" | "deactivated";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          profile_image?: string | null;
          phone_number?: string | null;
          preferred_language?: string;
          account_status?: "active" | "suspended" | "deactivated";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          profile_image?: string | null;
          phone_number?: string | null;
          preferred_language?: string;
          account_status?: "active" | "suspended" | "deactivated";
          created_at?: string;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: UserRole;
          created_at?: string;
        };
      };
      authors: {
        Row: {
          id: string;
          user_id: string;
          author_name: string;
          biography: string | null;
          profile_image: string | null;
          preferred_language: string;
          application_status: AuthorApplicationStatus;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          author_name: string;
          biography?: string | null;
          profile_image?: string | null;
          preferred_language?: string;
          application_status?: AuthorApplicationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          author_name?: string;
          biography?: string | null;
          profile_image?: string | null;
          preferred_language?: string;
          application_status?: AuthorApplicationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          category_name: string;
          description: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          description?: string | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          description?: string | null;
          language?: string;
          created_at?: string;
        };
      };
      book_categories: {
        Row: {
          id: string;
          category_name: string;
          description: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_name: string;
          description?: string | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_name?: string;
          description?: string | null;
          language?: string;
          created_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          author_id: string | null;
          category_id: string | null;
          language: string;
          cover_image: string | null;
          book_format: string;
          file_path: string | null;
          price: number;
          access_type: BookAccessType;
          publication_status: BookPublicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          language?: string;
          cover_image?: string | null;
          book_format?: string;
          file_path?: string | null;
          price?: number;
          access_type?: BookAccessType;
          publication_status?: BookPublicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          author_id?: string | null;
          category_id?: string | null;
          language?: string;
          cover_image?: string | null;
          book_format?: string;
          file_path?: string | null;
          price?: number;
          access_type?: BookAccessType;
          publication_status?: BookPublicationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          amount: number;
          currency: string;
          purchase_date: string;
          status: PurchaseStatus;
          access_granted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          amount: number;
          currency?: string;
          purchase_date?: string;
          status?: PurchaseStatus;
          access_granted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          amount?: number;
          currency?: string;
          purchase_date?: string;
          status?: PurchaseStatus;
          access_granted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: SubscriptionPlan;
          status: SubscriptionStatus;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: SubscriptionPlan;
          status?: SubscriptionStatus;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          page_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          page_number?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          page_number?: number;
          created_at?: string;
        };
      };
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          current_page: number;
          progress_percentage: number;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          current_page?: number;
          progress_percentage?: number;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          current_page?: number;
          progress_percentage?: number;
          last_read_at?: string;
        };
      };
      author_submissions: {
        Row: {
          id: string;
          author_id: string;
          book_id: string | null;
          title: string;
          synopsis: string | null;
          manuscript_url: string;
          sample_chapters_url: string | null;
          proposed_price: number;
          proposed_access_type: BookAccessType;
          language: string;
          status: AuthorSubmissionStatus;
          reviewer_feedback: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          royalty_percentage: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          book_id?: string | null;
          title: string;
          synopsis?: string | null;
          manuscript_url: string;
          sample_chapters_url?: string | null;
          proposed_price?: number;
          proposed_access_type?: BookAccessType;
          language?: string;
          status?: AuthorSubmissionStatus;
          reviewer_feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          royalty_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          book_id?: string | null;
          title?: string;
          synopsis?: string | null;
          manuscript_url?: string;
          sample_chapters_url?: string | null;
          proposed_price?: number;
          proposed_access_type?: BookAccessType;
          language?: string;
          status?: AuthorSubmissionStatus;
          reviewer_feedback?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          royalty_percentage?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: TransactionType;
          amount: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          payment_gateway: string;
          gateway_order_id: string | null;
          gateway_payment_id: string | null;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: TransactionType;
          amount: number;
          currency?: string;
          status?: "pending" | "completed" | "failed" | "refunded";
          payment_gateway?: string;
          gateway_order_id?: string | null;
          gateway_payment_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: TransactionType;
          amount?: number;
          currency?: string;
          status?: "pending" | "completed" | "failed" | "refunded";
          payment_gateway?: string;
          gateway_order_id?: string | null;
          gateway_payment_id?: string | null;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      favourites: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          notification_type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          notification_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          notification_type?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: string };
        Returns: boolean;
      };
      is_admin: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      is_approved_author: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      has_book_access: {
        Args: { _user_id: string; _book_id: string };
        Returns: boolean;
      };
    };
  };
}
