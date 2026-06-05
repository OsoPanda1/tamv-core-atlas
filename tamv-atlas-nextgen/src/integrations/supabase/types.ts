export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      article_versions: {
        Row: {
          article_id: string
          created_at: string
          edit_reason: string | null
          edited_by: string | null
          id: string
          new_body: string | null
          previous_body: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          edit_reason?: string | null
          edited_by?: string | null
          id?: string
          new_body?: string | null
          previous_body?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          edit_reason?: string | null
          edited_by?: string | null
          id?: string
          new_body?: string | null
          previous_body?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "wiki_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_artifacts: {
        Row: {
          content: string
          created_at: string
          entity_canonical_ids: string[]
          format: string
          hash: string
          id: string
          target: string
          trace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_canonical_ids?: string[]
          format?: string
          hash: string
          id?: string
          target: string
          trace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_canonical_ids?: string[]
          format?: string
          hash?: string
          id?: string
          target?: string
          trace_id?: string
        }
        Relationships: []
      }
      audit_metrics: {
        Row: {
          actor: string | null
          actual: number | null
          axis: string | null
          event_type: string | null
          federation_id: string | null
          id: string
          measured_at: string
          objetivo: number | null
          payload: Json | null
          source: string
        }
        Insert: {
          actor?: string | null
          actual?: number | null
          axis?: string | null
          event_type?: string | null
          federation_id?: string | null
          id?: string
          measured_at?: string
          objetivo?: number | null
          payload?: Json | null
          source?: string
        }
        Update: {
          actor?: string | null
          actual?: number | null
          axis?: string | null
          event_type?: string | null
          federation_id?: string | null
          id?: string
          measured_at?: string
          objetivo?: number | null
          payload?: Json | null
          source?: string
        }
        Relationships: []
      }
      bookpi_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_canonical_ids: string[]
          event_type: string
          hash: string
          id: string
          payload: Json
          source: string
          trace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_canonical_ids?: string[]
          event_type: string
          hash: string
          id?: string
          payload?: Json
          source: string
          trace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_canonical_ids?: string[]
          event_type?: string
          hash?: string
          id?: string
          payload?: Json
          source?: string
          trace_id?: string
        }
        Relationships: []
      }
      canon_entities: {
        Row: {
          canonical: boolean
          canonical_id: string
          created_at: string
          dependencies: string[]
          description: string | null
          federation: string
          hash: string
          id: string
          metadata: Json
          previous_hash: string | null
          source_refs: string[]
          title: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          canonical?: boolean
          canonical_id: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          federation?: string
          hash: string
          id?: string
          metadata?: Json
          previous_hash?: string | null
          source_refs?: string[]
          title: string
          type: string
          updated_at?: string
          version?: number
        }
        Update: {
          canonical?: boolean
          canonical_id?: string
          created_at?: string
          dependencies?: string[]
          description?: string | null
          federation?: string
          hash?: string
          id?: string
          metadata?: Json
          previous_hash?: string | null
          source_refs?: string[]
          title?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      canon_relations: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          relation_type: string
          source_canonical_id: string
          target_canonical_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          relation_type: string
          source_canonical_id: string
          target_canonical_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          relation_type?: string
          source_canonical_id?: string
          target_canonical_id?: string
        }
        Relationships: []
      }
      entity_versions: {
        Row: {
          canonical_id: string
          changed_at: string
          description: string | null
          hash: string
          id: string
          metadata: Json
          previous_hash: string | null
          title: string | null
          version: number
        }
        Insert: {
          canonical_id: string
          changed_at?: string
          description?: string | null
          hash: string
          id?: string
          metadata?: Json
          previous_hash?: string | null
          title?: string | null
          version: number
        }
        Update: {
          canonical_id?: string
          changed_at?: string
          description?: string | null
          hash?: string
          id?: string
          metadata?: Json
          previous_hash?: string | null
          title?: string | null
          version?: number
        }
        Relationships: []
      }
      federations: {
        Row: {
          color_token: string
          conceptual_pct: number
          description: string
          id: string
          level: number
          name: string
          nodes_declared: number
          production_pct: number
          updated_at: string
          wiring_pct: number
        }
        Insert: {
          color_token: string
          conceptual_pct?: number
          description: string
          id: string
          level: number
          name: string
          nodes_declared?: number
          production_pct?: number
          updated_at?: string
          wiring_pct?: number
        }
        Update: {
          color_token?: string
          conceptual_pct?: number
          description?: string
          id?: string
          level?: number
          name?: string
          nodes_declared?: number
          production_pct?: number
          updated_at?: string
          wiring_pct?: number
        }
        Relationships: []
      }
      github_repos: {
        Row: {
          description: string | null
          federation_id: string | null
          forks: number
          full_name: string
          id: string
          language: string | null
          name: string
          open_issues: number
          owner: string
          pushed_at: string | null
          stars: number
          synced_at: string
        }
        Insert: {
          description?: string | null
          federation_id?: string | null
          forks?: number
          full_name: string
          id?: string
          language?: string | null
          name: string
          open_issues?: number
          owner: string
          pushed_at?: string | null
          stars?: number
          synced_at?: string
        }
        Update: {
          description?: string | null
          federation_id?: string | null
          forks?: number
          full_name?: string
          id?: string
          language?: string | null
          name?: string
          open_issues?: number
          owner?: string
          pushed_at?: string | null
          stars?: number
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repos_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_profiles: {
        Row: {
          created_at: string
          did: string | null
          display_name: string
          doi_prefix: string | null
          github_handle: string | null
          id: string
          isni: string | null
          jsonld: Json | null
          orcid: string | null
          trust_score: number
          type: string
          updated_at: string
          zenodo_record: string | null
        }
        Insert: {
          created_at?: string
          did?: string | null
          display_name: string
          doi_prefix?: string | null
          github_handle?: string | null
          id?: string
          isni?: string | null
          jsonld?: Json | null
          orcid?: string | null
          trust_score?: number
          type: string
          updated_at?: string
          zenodo_record?: string | null
        }
        Update: {
          created_at?: string
          did?: string | null
          display_name?: string
          doi_prefix?: string | null
          github_handle?: string | null
          id?: string
          isni?: string | null
          jsonld?: Json | null
          orcid?: string | null
          trust_score?: number
          type?: string
          updated_at?: string
          zenodo_record?: string | null
        }
        Relationships: []
      }
      ingestion_runs: {
        Row: {
          batch_id: string | null
          entities_created: number
          error: string | null
          federation: string | null
          files_scanned: number
          finished_at: string | null
          id: string
          last_error_at: string | null
          relations_created: number
          repo_url: string
          retries: number
          skipped: number
          started_at: string
          started_by: string | null
          status: string
          trace_id: string
        }
        Insert: {
          batch_id?: string | null
          entities_created?: number
          error?: string | null
          federation?: string | null
          files_scanned?: number
          finished_at?: string | null
          id?: string
          last_error_at?: string | null
          relations_created?: number
          repo_url: string
          retries?: number
          skipped?: number
          started_at?: string
          started_by?: string | null
          status?: string
          trace_id: string
        }
        Update: {
          batch_id?: string | null
          entities_created?: number
          error?: string | null
          federation?: string | null
          files_scanned?: number
          finished_at?: string | null
          id?: string
          last_error_at?: string | null
          relations_created?: number
          repo_url?: string
          retries?: number
          skipped?: number
          started_at?: string
          started_by?: string | null
          status?: string
          trace_id?: string
        }
        Relationships: []
      }
      isni_credentials: {
        Row: {
          created_at: string
          expires_at: string | null
          holder_entity_id: string
          id: string
          issued_at: string
          issuer_did: string
          payload: Json
          signature: string
          status: string
          vc_id: string
          vc_type: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          holder_entity_id: string
          id?: string
          issued_at?: string
          issuer_did: string
          payload: Json
          signature: string
          status?: string
          vc_id: string
          vc_type: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          holder_entity_id?: string
          id?: string
          issued_at?: string
          issuer_did?: string
          payload?: Json
          signature?: string
          status?: string
          vc_id?: string
          vc_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "isni_credentials_holder_entity_id_fkey"
            columns: ["holder_entity_id"]
            isOneToOne: false
            referencedRelation: "isni_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      isni_entities: {
        Row: {
          created_at: string
          display_name: string
          entity_type: string
          id: string
          identifiers: Json
          is_public: boolean
          isni: string
          metadata: Json
          owner_id: string | null
          trust_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          entity_type: string
          id?: string
          identifiers?: Json
          is_public?: boolean
          isni: string
          metadata?: Json
          owner_id?: string | null
          trust_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          entity_type?: string
          id?: string
          identifiers?: Json
          is_public?: boolean
          isni?: string
          metadata?: Json
          owner_id?: string | null
          trust_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      mdx_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          domain: string
          hash: string
          id: string
          payload: Json
          result: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          domain: string
          hash: string
          id?: string
          payload?: Json
          result?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          domain?: string
          hash?: string
          id?: string
          payload?: Json
          result?: Json
        }
        Relationships: []
      }
      mdx_modules: {
        Row: {
          created_at: string
          description: string | null
          federation: string
          id: string
          last_heartbeat: string
          metrics: Json
          module_code: string
          name: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          federation: string
          id?: string
          last_heartbeat?: string
          metrics?: Json
          module_code: string
          name: string
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          federation?: string
          id?: string
          last_heartbeat?: string
          metrics?: Json
          module_code?: string
          name?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          did_tamv: string | null
          display_name: string | null
          id: string
          locale: string
          orcid: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          did_tamv?: string | null
          display_name?: string | null
          id: string
          locale?: string
          orcid?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          did_tamv?: string | null
          display_name?: string | null
          id?: string
          locale?: string
          orcid?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_phases: {
        Row: {
          actual: number
          eta: string | null
          fase: string
          id: string
          index_order: number
          milestone: string
          target: number
        }
        Insert: {
          actual?: number
          eta?: string | null
          fase: string
          id?: string
          index_order?: number
          milestone: string
          target?: number
        }
        Update: {
          actual?: number
          eta?: string | null
          fase?: string
          id?: string
          index_order?: number
          milestone?: string
          target?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      utamv_courses: {
        Row: {
          code: string
          created_at: string
          credits: number
          id: string
          is_published: boolean
          level: string
          summary: string | null
          syllabus: Json
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          id?: string
          is_published?: boolean
          level?: string
          summary?: string | null
          syllabus?: Json
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          id?: string
          is_published?: boolean
          level?: string
          summary?: string | null
          syllabus?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      utamv_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utamv_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "utamv_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_articles: {
        Row: {
          access_level: Database["public"]["Enums"]["app_role"]
          content_md: string
          created_at: string
          depth: Database["public"]["Enums"]["article_depth"]
          id: string
          is_critical: boolean
          module_id: string
          read_minutes: number
          search_tsv: unknown
          slug: string
          source_doc: string | null
          status: Database["public"]["Enums"]["article_status"]
          summary: string
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["app_role"]
          content_md?: string
          created_at?: string
          depth?: Database["public"]["Enums"]["article_depth"]
          id?: string
          is_critical?: boolean
          module_id: string
          read_minutes?: number
          search_tsv?: unknown
          slug: string
          source_doc?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          access_level?: Database["public"]["Enums"]["app_role"]
          content_md?: string
          created_at?: string
          depth?: Database["public"]["Enums"]["article_depth"]
          id?: string
          is_critical?: boolean
          module_id?: string
          read_minutes?: number
          search_tsv?: unknown
          slug?: string
          source_doc?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "wiki_articles_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "wiki_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_modules: {
        Row: {
          created_at: string
          description: string | null
          federation_id: string | null
          id: string
          index_order: number
          level: number
          slug: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          federation_id?: string | null
          id: string
          index_order?: number
          level: number
          slug: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          federation_id?: string | null
          id?: string
          index_order?: number
          level?: number
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_modules_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_min_role: {
        Args: {
          _min: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "ciudadano"
        | "dev"
        | "empresario"
        | "academia"
        | "gobierno"
        | "admin"
      article_depth:
        | "intro"
        | "tecnico"
        | "constitucional"
        | "filosofico"
        | "juridico"
        | "operativo"
      article_status: "draft" | "review" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "ciudadano",
        "dev",
        "empresario",
        "academia",
        "gobierno",
        "admin",
      ],
      article_depth: [
        "intro",
        "tecnico",
        "constitucional",
        "filosofico",
        "juridico",
        "operativo",
      ],
      article_status: ["draft", "review", "published", "archived"],
    },
  },
} as const
