
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"changes": Json | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": number,"organization_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: never,"organization_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: never,"organization_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_observations": {
                  Row: {
                    "audit_id": string,"category": string,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_vulnerability": boolean,"location": string | null,"organization_id": string,"photo_paths": (string)[],"position": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audit_id": string,"category": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_vulnerability"?: boolean,"location"?: string | null,"organization_id"?: string,"photo_paths"?: (string)[],"position"?: number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "audit_id"?: string,"category"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_vulnerability"?: boolean,"location"?: string | null,"organization_id"?: string,"photo_paths"?: (string)[],"position"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_observations_audit_id_fkey"
      columns: ["audit_id"]
isOneToOne: false
      referencedRelation: "audits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_observations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_observations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_templates": {
                  Row: {
                    "categories": NonNullable<Json>,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"organization_id": string,"questions": NonNullable<Json>,"scoring": NonNullable<Json>,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "categories"?: NonNullable<Json>,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"organization_id"?: string,"questions"?: NonNullable<Json>,"scoring": NonNullable<Json>,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "categories"?: NonNullable<Json>,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"organization_id"?: string,"questions"?: NonNullable<Json>,"scoring"?: NonNullable<Json>,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_templates_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"audits": {
                  Row: {
                    "answers": NonNullable<Json>,"audit_date": string | null,"auditor_id": string | null,"client_id": string,"context": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"draft_version": number,"id": string,"methodology": string | null,"mission_id": string | null,"organization_id": string,"reference": string,"scoring_snapshot": Json | null,"site_address": string | null,"site_name": string | null,"status": string,"summary": string | null,"template_id": string | null,"title": string,"updated_at": string,"validated_at": string | null,"validated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"audit_date"?: string | null,"auditor_id"?: string | null,"client_id": string,"context"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"draft_version"?: number,"id"?: string,"methodology"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"reference"?: string,"scoring_snapshot"?: Json | null,"site_address"?: string | null,"site_name"?: string | null,"status"?: string,"summary"?: string | null,"template_id"?: string | null,"title": string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"audit_date"?: string | null,"auditor_id"?: string | null,"client_id"?: string,"context"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"draft_version"?: number,"id"?: string,"methodology"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"reference"?: string,"scoring_snapshot"?: Json | null,"site_address"?: string | null,"site_name"?: string | null,"status"?: string,"summary"?: string | null,"template_id"?: string | null,"title"?: string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audits_auditor_id_fkey"
      columns: ["auditor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "audit_templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audits_validated_by_fkey"
      columns: ["validated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"calendar_events": {
                  Row: {
                    "client_id": string | null,"created_at": string,"description": string | null,"ends_at": string,"id": string,"kind": string,"location": string | null,"mission_id": string | null,"organization_id": string,"owner_id": string | null,"starts_at": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id"?: string | null,"created_at"?: string,"description"?: string | null,"ends_at": string,"id"?: string,"kind"?: string,"location"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"starts_at": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string | null,"created_at"?: string,"description"?: string | null,"ends_at"?: string,"id"?: string,"kind"?: string,"location"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"starts_at"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendar_events_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_events_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_events_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "calendar_events_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"client_approvals": {
                  Row: {
                    "client_id": string,"created_at": string,"description": string | null,"document_id": string | null,"id": string,"mission_id": string | null,"organization_id": string,"requested_by": string | null,"responded_at": string | null,"responded_by": string | null,"response_comment": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"description"?: string | null,"document_id"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"requested_by"?: string | null,"responded_at"?: string | null,"responded_by"?: string | null,"response_comment"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"description"?: string | null,"document_id"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"requested_by"?: string | null,"responded_at"?: string | null,"responded_by"?: string | null,"response_comment"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_approvals_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_approvals_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_approvals_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_approvals_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_approvals_requested_by_fkey"
      columns: ["requested_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_approvals_responded_by_fkey"
      columns: ["responded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "address_line": string | null,"category": string,"city": string | null,"country": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"email": string | null,"id": string,"name": string,"notes": string | null,"organization_id": string,"owner_id": string | null,"phone": string | null,"postal_code": string | null,"sector": string | null,"siren": string | null,"siret": string | null,"status": string,"updated_at": string,"vat_number": string | null,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line"?: string | null,"category"?: string,"city"?: string | null,"country"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"sector"?: string | null,"siren"?: string | null,"siret"?: string | null,"status"?: string,"updated_at"?: string,"vat_number"?: string | null,"website"?: string | null
                  }
                  Update: {
                    "address_line"?: string | null,"category"?: string,"city"?: string | null,"country"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"sector"?: string | null,"siren"?: string | null,"siret"?: string | null,"status"?: string,"updated_at"?: string,"vat_number"?: string | null,"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contacts": {
                  Row: {
                    "client_id": string,"created_at": string,"deleted_at": string | null,"email": string | null,"first_name": string,"id": string,"is_primary": boolean,"job_title": string | null,"last_name": string,"notes": string | null,"organization_id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"first_name": string,"id"?: string,"is_primary"?: boolean,"job_title"?: string | null,"last_name": string,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"first_name"?: string,"id"?: string,"is_primary"?: boolean,"job_title"?: string | null,"last_name"?: string,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"document_shares": {
                  Row: {
                    "created_at": string,"created_by": string | null,"document_id": string,"download_count": number,"expires_at": string,"id": string,"max_downloads": number,"organization_id": string,"recipient": string | null,"revoked_at": string | null,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"document_id": string,"download_count"?: number,"expires_at": string,"id"?: string,"max_downloads"?: number,"organization_id"?: string,"recipient"?: string | null,"revoked_at"?: string | null,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"document_id"?: string,"download_count"?: number,"expires_at"?: string,"id"?: string,"max_downloads"?: number,"organization_id"?: string,"recipient"?: string | null,"revoked_at"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "document_shares_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "document_shares_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "document_shares_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"document_versions": {
                  Row: {
                    "comment": string | null,"created_at": string,"document_id": string,"file_name": string,"id": string,"mime_type": string,"organization_id": string,"sha256": string,"size_bytes": number,"storage_bucket": string,"storage_path": string,"uploaded_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"document_id": string,"file_name": string,"id"?: string,"mime_type": string,"organization_id"?: string,"sha256": string,"size_bytes": number,"storage_bucket"?: string,"storage_path": string,"uploaded_by"?: string | null,"version": number
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"document_id"?: string,"file_name"?: string,"id"?: string,"mime_type"?: string,"organization_id"?: string,"sha256"?: string,"size_bytes"?: number,"storage_bucket"?: string,"storage_path"?: string,"uploaded_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "document_versions_document_id_fkey"
      columns: ["document_id"]
isOneToOne: false
      referencedRelation: "documents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "document_versions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "document_versions_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "archived_at": string | null,"audit_id": string | null,"category": string,"client_id": string | null,"client_visible": boolean,"confidentiality": string,"created_at": string,"created_by": string | null,"current_version": number,"deleted_at": string | null,"description": string | null,"id": string,"mission_id": string | null,"organization_id": string,"project_id": string | null,"tags": (string)[],"title": string,"updated_at": string,"uploaded_by_client": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"audit_id"?: string | null,"category"?: string,"client_id"?: string | null,"client_visible"?: boolean,"confidentiality"?: string,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"project_id"?: string | null,"tags"?: (string)[],"title": string,"updated_at"?: string,"uploaded_by_client"?: boolean
                  }
                  Update: {
                    "archived_at"?: string | null,"audit_id"?: string | null,"category"?: string,"client_id"?: string | null,"client_visible"?: boolean,"confidentiality"?: string,"created_at"?: string,"created_by"?: string | null,"current_version"?: number,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"project_id"?: string | null,"tags"?: (string)[],"title"?: string,"updated_at"?: string,"uploaded_by_client"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_audit_id_fkey"
      columns: ["audit_id"]
isOneToOne: false
      referencedRelation: "audits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "documents_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"intelligence_items": {
                  Row: {
                    "collected_at": string,"created_at": string,"credibility": number | null,"excerpt": string | null,"id": string,"organization_id": string,"published_at": string | null,"source_id": string,"status": string,"theme": string | null,"title": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collected_at"?: string,"created_at"?: string,"credibility"?: number | null,"excerpt"?: string | null,"id"?: string,"organization_id"?: string,"published_at"?: string | null,"source_id": string,"status"?: string,"theme"?: string | null,"title": string,"url": string
                  }
                  Update: {
                    "collected_at"?: string,"created_at"?: string,"credibility"?: number | null,"excerpt"?: string | null,"id"?: string,"organization_id"?: string,"published_at"?: string | null,"source_id"?: string,"status"?: string,"theme"?: string | null,"title"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intelligence_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intelligence_items_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "intelligence_sources"
      referencedColumns: ["id"]
    }
                  ]
                },"intelligence_report_recipients": {
                  Row: {
                    "client_id": string,"organization_id": string,"report_id": string,"sent_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"organization_id"?: string,"report_id": string,"sent_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"organization_id"?: string,"report_id"?: string,"sent_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intelligence_report_recipients_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intelligence_report_recipients_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intelligence_report_recipients_report_id_fkey"
      columns: ["report_id"]
isOneToOne: false
      referencedRelation: "intelligence_reports"
      referencedColumns: ["id"]
    }
                  ]
                },"intelligence_reports": {
                  Row: {
                    "ai_generated": boolean,"author_id": string | null,"body": string | null,"created_at": string,"id": string,"kind": string,"organization_id": string,"published_at": string | null,"severity": string | null,"source_refs": NonNullable<Json>,"status": string,"summary": string | null,"themes": (string)[],"title": string,"updated_at": string,"validated_at": string | null,"validated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_generated"?: boolean,"author_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind": string,"organization_id"?: string,"published_at"?: string | null,"severity"?: string | null,"source_refs"?: NonNullable<Json>,"status"?: string,"summary"?: string | null,"themes"?: (string)[],"title": string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Update: {
                    "ai_generated"?: boolean,"author_id"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"organization_id"?: string,"published_at"?: string | null,"severity"?: string | null,"source_refs"?: NonNullable<Json>,"status"?: string,"summary"?: string | null,"themes"?: (string)[],"title"?: string,"updated_at"?: string,"validated_at"?: string | null,"validated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "intelligence_reports_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intelligence_reports_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "intelligence_reports_validated_by_fkey"
      columns: ["validated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"intelligence_sources": {
                  Row: {
                    "access_terms": string | null,"collection_allowed": boolean,"created_at": string,"deleted_at": string | null,"feed_url": string | null,"id": string,"is_active": boolean,"kind": string,"last_collected_at": string | null,"name": string,"notes": string | null,"organization_id": string,"reliability": string,"themes": (string)[],"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_terms"?: string | null,"collection_allowed"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"feed_url"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: string,"last_collected_at"?: string | null,"name": string,"notes"?: string | null,"organization_id"?: string,"reliability"?: string,"themes"?: (string)[],"updated_at"?: string,"url": string
                  }
                  Update: {
                    "access_terms"?: string | null,"collection_allowed"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"feed_url"?: string | null,"id"?: string,"is_active"?: boolean,"kind"?: string,"last_collected_at"?: string | null,"name"?: string,"notes"?: string | null,"organization_id"?: string,"reliability"?: string,"themes"?: (string)[],"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "intelligence_sources_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"invoice_items": {
                  Row: {
                    "catalog_item_id": string | null,"description": string,"discount_rate": number,"id": string,"invoice_id": string,"organization_id": string,"position": number,"quantity": number,"total_ht": number | null,"unit": string,"unit_price": number,"vat_rate": number
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_item_id"?: string | null,"description": string,"discount_rate"?: number,"id"?: string,"invoice_id": string,"organization_id"?: string,"position"?: number,"quantity": number,"total_ht"?: never,"unit"?: string,"unit_price": number,"vat_rate"?: number
                  }
                  Update: {
                    "catalog_item_id"?: string | null,"description"?: string,"discount_rate"?: number,"id"?: string,"invoice_id"?: string,"organization_id"?: string,"position"?: number,"quantity"?: number,"total_ht"?: never,"unit"?: string,"unit_price"?: number,"vat_rate"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoice_items_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "service_catalog"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_items_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoice_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "amount_credited": number,"amount_paid": number,"client_id": string,"client_snapshot": Json | null,"created_at": string,"created_by": string | null,"credited_invoice_id": string | null,"deleted_at": string | null,"discount_amount": number,"discount_rate": number,"due_date": string | null,"id": string,"issue_date": string | null,"issued_at": string | null,"issued_by": string | null,"kind": string,"legal_mentions": Json | null,"mission_id": string | null,"notes": string | null,"number": string | null,"organization_id": string,"payment_terms": string | null,"quote_id": string | null,"seller_snapshot": Json | null,"service_date": string | null,"status": string,"subtotal_ht": number,"title": string,"total_ht": number,"total_ttc": number,"total_vat": number,"updated_at": string,"vat_breakdown": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_credited"?: number,"amount_paid"?: number,"client_id": string,"client_snapshot"?: Json | null,"created_at"?: string,"created_by"?: string | null,"credited_invoice_id"?: string | null,"deleted_at"?: string | null,"discount_amount"?: number,"discount_rate"?: number,"due_date"?: string | null,"id"?: string,"issue_date"?: string | null,"issued_at"?: string | null,"issued_by"?: string | null,"kind"?: string,"legal_mentions"?: Json | null,"mission_id"?: string | null,"notes"?: string | null,"number"?: string | null,"organization_id"?: string,"payment_terms"?: string | null,"quote_id"?: string | null,"seller_snapshot"?: Json | null,"service_date"?: string | null,"status"?: string,"subtotal_ht"?: number,"title": string,"total_ht"?: number,"total_ttc"?: number,"total_vat"?: number,"updated_at"?: string,"vat_breakdown"?: NonNullable<Json>
                  }
                  Update: {
                    "amount_credited"?: number,"amount_paid"?: number,"client_id"?: string,"client_snapshot"?: Json | null,"created_at"?: string,"created_by"?: string | null,"credited_invoice_id"?: string | null,"deleted_at"?: string | null,"discount_amount"?: number,"discount_rate"?: number,"due_date"?: string | null,"id"?: string,"issue_date"?: string | null,"issued_at"?: string | null,"issued_by"?: string | null,"kind"?: string,"legal_mentions"?: Json | null,"mission_id"?: string | null,"notes"?: string | null,"number"?: string | null,"organization_id"?: string,"payment_terms"?: string | null,"quote_id"?: string | null,"seller_snapshot"?: Json | null,"service_date"?: string | null,"status"?: string,"subtotal_ht"?: number,"title"?: string,"total_ht"?: number,"total_ttc"?: number,"total_vat"?: number,"updated_at"?: string,"vat_breakdown"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_credited_invoice_id_fkey"
      columns: ["credited_invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_issued_by_fkey"
      columns: ["issued_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invoices_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "category": string | null,"client_id": string | null,"company": string | null,"consent_at": string | null,"contact_name": string | null,"created_at": string,"deleted_at": string | null,"email": string | null,"estimated_amount": number | null,"expected_close_date": string | null,"id": string,"lost_reason": string | null,"message": string | null,"organization_id": string,"owner_id": string | null,"phone": string | null,"probability": number | null,"protect_assessment_id": string | null,"source": string,"stage": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"client_id"?: string | null,"company"?: string | null,"consent_at"?: string | null,"contact_name"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"estimated_amount"?: number | null,"expected_close_date"?: string | null,"id"?: string,"lost_reason"?: string | null,"message"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"phone"?: string | null,"probability"?: number | null,"protect_assessment_id"?: string | null,"source"?: string,"stage"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string | null,"client_id"?: string | null,"company"?: string | null,"consent_at"?: string | null,"contact_name"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"estimated_amount"?: number | null,"expected_close_date"?: string | null,"id"?: string,"lost_reason"?: string | null,"message"?: string | null,"organization_id"?: string,"owner_id"?: string | null,"phone"?: string | null,"probability"?: number | null,"protect_assessment_id"?: string | null,"source"?: string,"stage"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_protect_assessment_id_fkey"
      columns: ["protect_assessment_id"]
isOneToOne: false
      referencedRelation: "protect_assessments"
      referencedColumns: ["id"]
    }
                  ]
                },"memberships": {
                  Row: {
                    "active": boolean,"client_id": string | null,"created_at": string,"id": string,"organization_id": string,"role": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"client_id"?: string | null,"created_at"?: string,"id"?: string,"organization_id": string,"role": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"client_id"?: string | null,"created_at"?: string,"id"?: string,"organization_id"?: string,"role"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_client_fk"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"client_id": string,"created_at": string,"from_client": boolean,"id": string,"mission_id": string | null,"organization_id": string,"read_by_client_at": string | null,"read_by_staff_at": string | null,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"client_id": string,"created_at"?: string,"from_client"?: boolean,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"read_by_client_at"?: string | null,"read_by_staff_at"?: string | null,"sender_id"?: string
                  }
                  Update: {
                    "body"?: string,"client_id"?: string,"created_at"?: string,"from_client"?: boolean,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"read_by_client_at"?: string | null,"read_by_staff_at"?: string | null,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"milestones": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"due_date": string | null,"id": string,"organization_id": string,"position": number,"project_id": string,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"due_date"?: string | null,"id"?: string,"organization_id"?: string,"position"?: number,"project_id": string,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"due_date"?: string | null,"id"?: string,"organization_id"?: string,"position"?: number,"project_id"?: string,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "milestones_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"mission_members": {
                  Row: {
                    "created_at": string,"mission_id": string,"organization_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"mission_id": string,"organization_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"mission_id"?: string,"organization_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mission_members_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mission_members_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mission_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"missions": {
                  Row: {
                    "budget": number | null,"client_id": string,"client_visible": boolean,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"end_date": string | null,"id": string,"is_confidential": boolean,"manager_id": string | null,"organization_id": string,"progress": number,"reference": string,"service_type": string,"start_date": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget"?: number | null,"client_id": string,"client_visible"?: boolean,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"is_confidential"?: boolean,"manager_id"?: string | null,"organization_id"?: string,"progress"?: number,"reference"?: string,"service_type": string,"start_date"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "budget"?: number | null,"client_id"?: string,"client_visible"?: boolean,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"is_confidential"?: boolean,"manager_id"?: string | null,"organization_id"?: string,"progress"?: number,"reference"?: string,"service_type"?: string,"start_date"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "missions_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "missions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "missions_manager_id_fkey"
      columns: ["manager_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "missions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "author_id": string | null,"body": string,"client_id": string | null,"created_at": string,"id": string,"lead_id": string | null,"mission_id": string | null,"organization_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"client_id"?: string | null,"created_at"?: string,"id"?: string,"lead_id"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"client_id"?: string | null,"created_at"?: string,"id"?: string,"lead_id"?: string | null,"mission_id"?: string | null,"organization_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string,"id": string,"link": string | null,"organization_id": string,"read_at": string | null,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"organization_id": string,"read_at"?: string | null,"title": string,"user_id": string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"id"?: string,"link"?: string | null,"organization_id"?: string,"read_at"?: string | null,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"number_sequences": {
                  Row: {
                    "kind": string,"last_value": number,"organization_id": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "kind": string,"last_value"?: number,"organization_id": string,"year": number
                  }
                  Update: {
                    "kind"?: string,"last_value"?: number,"organization_id"?: string,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "number_sequences_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "address_line": string | null,"bic": string | null,"city": string | null,"country": string,"created_at": string,"email": string | null,"iban": string | null,"id": string,"invoice_settings": NonNullable<Json>,"is_default": boolean,"legal_form": string | null,"legal_name": string | null,"name": string,"numbering": NonNullable<Json>,"phone": string | null,"postal_code": string | null,"rcs": string | null,"siren": string | null,"siret": string | null,"updated_at": string,"vat_number": string | null,"vat_regime": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line"?: string | null,"bic"?: string | null,"city"?: string | null,"country"?: string,"created_at"?: string,"email"?: string | null,"iban"?: string | null,"id"?: string,"invoice_settings"?: NonNullable<Json>,"is_default"?: boolean,"legal_form"?: string | null,"legal_name"?: string | null,"name": string,"numbering"?: NonNullable<Json>,"phone"?: string | null,"postal_code"?: string | null,"rcs"?: string | null,"siren"?: string | null,"siret"?: string | null,"updated_at"?: string,"vat_number"?: string | null,"vat_regime"?: string,"website"?: string | null
                  }
                  Update: {
                    "address_line"?: string | null,"bic"?: string | null,"city"?: string | null,"country"?: string,"created_at"?: string,"email"?: string | null,"iban"?: string | null,"id"?: string,"invoice_settings"?: NonNullable<Json>,"is_default"?: boolean,"legal_form"?: string | null,"legal_name"?: string | null,"name"?: string,"numbering"?: NonNullable<Json>,"phone"?: string | null,"postal_code"?: string | null,"rcs"?: string | null,"siren"?: string | null,"siret"?: string | null,"updated_at"?: string,"vat_number"?: string | null,"vat_regime"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"payment_reminders": {
                  Row: {
                    "channel": string,"created_by": string | null,"id": string,"invoice_id": string,"level": number,"notes": string | null,"organization_id": string,"sent_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel"?: string,"created_by"?: string | null,"id"?: string,"invoice_id": string,"level": number,"notes"?: string | null,"organization_id"?: string,"sent_at"?: string
                  }
                  Update: {
                    "channel"?: string,"created_by"?: string | null,"id"?: string,"invoice_id"?: string,"level"?: number,"notes"?: string | null,"organization_id"?: string,"sent_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payment_reminders_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_reminders_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payment_reminders_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string | null,"id": string,"invoice_id": string,"method": string,"notes": string | null,"organization_id": string,"paid_at": string,"reference": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invoice_id": string,"method"?: string,"notes"?: string | null,"organization_id"?: string,"paid_at"?: string,"reference"?: string | null
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"invoice_id"?: string,"method"?: string,"notes"?: string | null,"organization_id"?: string,"paid_at"?: string,"reference"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string,"job_title": string | null,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"job_title"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"job_title"?: string | null,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_decisions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"decided_at": string,"decided_by": string | null,"description": string | null,"due_date": string | null,"id": string,"kind": string,"meeting_id": string | null,"organization_id": string,"owner": string | null,"project_id": string,"resolved_at": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"decided_at"?: string,"decided_by"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"kind": string,"meeting_id"?: string | null,"organization_id"?: string,"owner"?: string | null,"project_id": string,"resolved_at"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"decided_at"?: string,"decided_by"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"kind"?: string,"meeting_id"?: string | null,"organization_id"?: string,"owner"?: string | null,"project_id"?: string,"resolved_at"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_decisions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_decisions_meeting_id_fkey"
      columns: ["meeting_id"]
isOneToOne: false
      referencedRelation: "project_meetings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_decisions_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_decisions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_meetings": {
                  Row: {
                    "attendees": string | null,"client_visible": boolean,"created_at": string,"held_at": string,"id": string,"location": string | null,"minutes": string | null,"organization_id": string,"project_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attendees"?: string | null,"client_visible"?: boolean,"created_at"?: string,"held_at": string,"id"?: string,"location"?: string | null,"minutes"?: string | null,"organization_id"?: string,"project_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "attendees"?: string | null,"client_visible"?: boolean,"created_at"?: string,"held_at"?: string,"id"?: string,"location"?: string | null,"minutes"?: string | null,"organization_id"?: string,"project_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_meetings_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_meetings_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "budget": number | null,"client_id": string,"client_visible": boolean,"closed_at": string | null,"closure_notes": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"description": string | null,"end_date": string | null,"id": string,"mission_id": string | null,"name": string,"organization_id": string,"phase": string,"reception_date": string | null,"reception_notes": string | null,"reference": string,"specification": string | null,"start_date": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget"?: number | null,"client_id": string,"client_visible"?: boolean,"closed_at"?: string | null,"closure_notes"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"mission_id"?: string | null,"name": string,"organization_id"?: string,"phase"?: string,"reception_date"?: string | null,"reception_notes"?: string | null,"reference"?: string,"specification"?: string | null,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "budget"?: number | null,"client_id"?: string,"client_visible"?: boolean,"closed_at"?: string | null,"closure_notes"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"mission_id"?: string | null,"name"?: string,"organization_id"?: string,"phase"?: string,"reception_date"?: string | null,"reception_notes"?: string | null,"reference"?: string,"specification"?: string | null,"start_date"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"protect_assessments": {
                  Row: {
                    "answers": NonNullable<Json>,"audience": string,"consent_at": string | null,"contact_requested": boolean,"created_at": string,"department": string | null,"id": string,"ip_hash": string | null,"lead_id": string | null,"level": string,"organization_id": string,"score": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers": NonNullable<Json>,"audience": string,"consent_at"?: string | null,"contact_requested"?: boolean,"created_at"?: string,"department"?: string | null,"id"?: string,"ip_hash"?: string | null,"lead_id"?: string | null,"level": string,"organization_id": string,"score": number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"audience"?: string,"consent_at"?: string | null,"contact_requested"?: boolean,"created_at"?: string,"department"?: string | null,"id"?: string,"ip_hash"?: string | null,"lead_id"?: string | null,"level"?: string,"organization_id"?: string,"score"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "protect_assessments_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "protect_assessments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"quote_items": {
                  Row: {
                    "catalog_item_id": string | null,"description": string,"discount_rate": number,"id": string,"organization_id": string,"position": number,"quantity": number,"quote_id": string,"total_ht": number | null,"unit": string,"unit_price": number,"vat_rate": number
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_item_id"?: string | null,"description": string,"discount_rate"?: number,"id"?: string,"organization_id"?: string,"position"?: number,"quantity": number,"quote_id": string,"total_ht"?: never,"unit"?: string,"unit_price": number,"vat_rate"?: number
                  }
                  Update: {
                    "catalog_item_id"?: string | null,"description"?: string,"discount_rate"?: number,"id"?: string,"organization_id"?: string,"position"?: number,"quantity"?: number,"quote_id"?: string,"total_ht"?: never,"unit"?: string,"unit_price"?: number,"vat_rate"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_items_catalog_item_id_fkey"
      columns: ["catalog_item_id"]
isOneToOne: false
      referencedRelation: "service_catalog"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "client_id": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"discount_amount": number,"discount_rate": number,"id": string,"introduction": string | null,"issue_date": string,"lead_id": string | null,"mission_id": string | null,"number": string,"organization_id": string,"payment_terms": string | null,"responded_at": string | null,"response_comment": string | null,"sent_at": string | null,"status": string,"subtotal_ht": number,"terms": string | null,"title": string,"total_ht": number,"total_ttc": number,"total_vat": number,"updated_at": string,"valid_until": string | null,"vat_breakdown": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"discount_amount"?: number,"discount_rate"?: number,"id"?: string,"introduction"?: string | null,"issue_date"?: string,"lead_id"?: string | null,"mission_id"?: string | null,"number"?: string,"organization_id"?: string,"payment_terms"?: string | null,"responded_at"?: string | null,"response_comment"?: string | null,"sent_at"?: string | null,"status"?: string,"subtotal_ht"?: number,"terms"?: string | null,"title": string,"total_ht"?: number,"total_ttc"?: number,"total_vat"?: number,"updated_at"?: string,"valid_until"?: string | null,"vat_breakdown"?: NonNullable<Json>
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"discount_amount"?: number,"discount_rate"?: number,"id"?: string,"introduction"?: string | null,"issue_date"?: string,"lead_id"?: string | null,"mission_id"?: string | null,"number"?: string,"organization_id"?: string,"payment_terms"?: string | null,"responded_at"?: string | null,"response_comment"?: string | null,"sent_at"?: string | null,"status"?: string,"subtotal_ht"?: number,"terms"?: string | null,"title"?: string,"total_ht"?: number,"total_ttc"?: number,"total_vat"?: number,"updated_at"?: string,"valid_until"?: string | null,"vat_breakdown"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quotes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"recommendations": {
                  Row: {
                    "audit_id": string,"client_visible": boolean,"completed_at": string | null,"created_at": string,"description": string | null,"due_date": string | null,"estimated_cost": number | null,"horizon": string | null,"id": string,"organization_id": string,"owner": string | null,"priority": string,"risk_id": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audit_id": string,"client_visible"?: boolean,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"estimated_cost"?: number | null,"horizon"?: string | null,"id"?: string,"organization_id"?: string,"owner"?: string | null,"priority"?: string,"risk_id"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "audit_id"?: string,"client_visible"?: boolean,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"estimated_cost"?: number | null,"horizon"?: string | null,"id"?: string,"organization_id"?: string,"owner"?: string | null,"priority"?: string,"risk_id"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recommendations_audit_id_fkey"
      columns: ["audit_id"]
isOneToOne: false
      referencedRelation: "audits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendations_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendations_risk_id_fkey"
      columns: ["risk_id"]
isOneToOne: false
      referencedRelation: "risk_assessments"
      referencedColumns: ["id"]
    }
                  ]
                },"risk_assessments": {
                  Row: {
                    "audit_id": string,"category": string,"created_at": string,"criteria": NonNullable<Json>,"id": string,"impact": number,"is_validated": boolean,"justification": string,"level": string,"likelihood": number,"observation_id": string | null,"organization_id": string,"score": number | null,"threat": string,"updated_at": string,"vulnerability": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audit_id": string,"category": string,"created_at"?: string,"criteria"?: NonNullable<Json>,"id"?: string,"impact": number,"is_validated"?: boolean,"justification": string,"level": string,"likelihood": number,"observation_id"?: string | null,"organization_id"?: string,"score"?: never,"threat": string,"updated_at"?: string,"vulnerability"?: string | null
                  }
                  Update: {
                    "audit_id"?: string,"category"?: string,"created_at"?: string,"criteria"?: NonNullable<Json>,"id"?: string,"impact"?: number,"is_validated"?: boolean,"justification"?: string,"level"?: string,"likelihood"?: number,"observation_id"?: string | null,"organization_id"?: string,"score"?: never,"threat"?: string,"updated_at"?: string,"vulnerability"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "risk_assessments_audit_id_fkey"
      columns: ["audit_id"]
isOneToOne: false
      referencedRelation: "audits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "risk_assessments_observation_id_fkey"
      columns: ["observation_id"]
isOneToOne: false
      referencedRelation: "audit_observations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "risk_assessments_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"selection_criteria": {
                  Row: {
                    "id": string,"label": string,"organization_id": string,"position": number,"project_id": string,"weight": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"label": string,"organization_id"?: string,"position"?: number,"project_id": string,"weight": number
                  }
                  Update: {
                    "id"?: string,"label"?: string,"organization_id"?: string,"position"?: number,"project_id"?: string,"weight"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "selection_criteria_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "selection_criteria_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"service_catalog": {
                  Row: {
                    "code": string,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"organization_id": string,"service_type": string | null,"unit": string,"unit_price": number,"updated_at": string,"vat_rate": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"organization_id"?: string,"service_type"?: string | null,"unit"?: string,"unit_price": number,"updated_at"?: string,"vat_rate"?: number
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"organization_id"?: string,"service_type"?: string | null,"unit"?: string,"unit_price"?: number,"updated_at"?: string,"vat_rate"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_catalog_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "assignee_id": string | null,"client_id": string | null,"client_visible": boolean,"completed_at": string | null,"created_at": string,"created_by": string | null,"description": string | null,"due_date": string | null,"id": string,"mission_id": string | null,"organization_id": string,"priority": string,"project_id": string | null,"status": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assignee_id"?: string | null,"client_id"?: string | null,"client_visible"?: boolean,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"priority"?: string,"project_id"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "assignee_id"?: string | null,"client_id"?: string | null,"client_visible"?: boolean,"completed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"due_date"?: string | null,"id"?: string,"mission_id"?: string | null,"organization_id"?: string,"priority"?: string,"project_id"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assignee_id_fkey"
      columns: ["assignee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_mission_id_fkey"
      columns: ["mission_id"]
isOneToOne: false
      referencedRelation: "missions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_fk"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"vendor_offers": {
                  Row: {
                    "amount_ht": number,"created_at": string,"delay_weeks": number | null,"id": string,"is_selected": boolean,"organization_id": string,"project_id": string,"received_at": string | null,"scope_notes": string | null,"scores": NonNullable<Json>,"strengths": string | null,"updated_at": string,"vendor_id": string,"weaknesses": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_ht": number,"created_at"?: string,"delay_weeks"?: number | null,"id"?: string,"is_selected"?: boolean,"organization_id"?: string,"project_id": string,"received_at"?: string | null,"scope_notes"?: string | null,"scores"?: NonNullable<Json>,"strengths"?: string | null,"updated_at"?: string,"vendor_id": string,"weaknesses"?: string | null
                  }
                  Update: {
                    "amount_ht"?: number,"created_at"?: string,"delay_weeks"?: number | null,"id"?: string,"is_selected"?: boolean,"organization_id"?: string,"project_id"?: string,"received_at"?: string | null,"scope_notes"?: string | null,"scores"?: NonNullable<Json>,"strengths"?: string | null,"updated_at"?: string,"vendor_id"?: string,"weaknesses"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendor_offers_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_offers_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vendor_offers_vendor_id_fkey"
      columns: ["vendor_id"]
isOneToOne: false
      referencedRelation: "vendors"
      referencedColumns: ["id"]
    }
                  ]
                },"vendors": {
                  Row: {
                    "address_line": string | null,"certifications": string | null,"city": string | null,"created_at": string,"deleted_at": string | null,"email": string | null,"id": string,"name": string,"notes": string | null,"organization_id": string,"phone": string | null,"siret": string | null,"specialty": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line"?: string | null,"certifications"?: string | null,"city"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"siret"?: string | null,"specialty"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "address_line"?: string | null,"certifications"?: string | null,"city"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"organization_id"?: string,"phone"?: string | null,"siret"?: string | null,"specialty"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vendors_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "client_respond_approval":
{ Args: { "p_approval": string,"p_approve": boolean,"p_comment": string }; Returns: undefined
                           },
"client_respond_quote":
{ Args: { "p_accept": boolean,"p_comment": string,"p_quote": string }; Returns: undefined
                           },
"close_project":
{ Args: { "p_notes": string,"p_project": string }; Returns: undefined
                           },
"consume_document_share":
{ Args: { "p_token_hash": string }; Returns: {
              "document_id": string,"file_name": string,"mime_type": string,"storage_bucket": string,"storage_path": string
            }[]
                           },
"convert_quote_to_invoice":
{ Args: { "p_quote": string }; Returns: string
                           },
"create_credit_note":
{ Args: { "p_invoice": string }; Returns: string
                           },
"global_search":
{ Args: { "p_query": string }; Returns: {
              "id": string,"kind": string,"link": string,"subtitle": string,"title": string
            }[]
                           },
"issue_invoice":
{ Args: { "p_invoice": string }; Returns: string
                           },
"mark_messages_read":
{ Args: { "p_client": string }; Returns: undefined
                           },
"publish_intelligence_report":
{ Args: { "p_clients": (string)[],"p_report": string }; Returns: undefined
                           },
"purge_protect_assessments":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"submit_protect_assessment":
{ Args: { "p_answers": Json,"p_audience": string,"p_contact"?: Json,"p_department": string,"p_ip_hash": string,"p_level": string,"p_score": number }; Returns: string
                           },
"validate_audit":
{ Args: { "p_audit": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
