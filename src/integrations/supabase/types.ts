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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dtc_findings: {
        Row: {
          created_at: string
          dtc_code: string
          id: string
          module_id: string | null
          module_name: string | null
          raw_code: string | null
          scan_id: string
          status_byte: string | null
        }
        Insert: {
          created_at?: string
          dtc_code: string
          id?: string
          module_id?: string | null
          module_name?: string | null
          raw_code?: string | null
          scan_id: string
          status_byte?: string | null
        }
        Update: {
          created_at?: string
          dtc_code?: string
          id?: string
          module_id?: string | null
          module_name?: string | null
          raw_code?: string | null
          scan_id?: string
          status_byte?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dtc_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "dtc_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      dtc_scans: {
        Row: {
          created_at: string
          id: string
          modules_scanned: number
          notes: string | null
          scan_date: string
          scan_duration_ms: number | null
          total_dtcs: number
          vehicle_id: string | null
          vin: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          modules_scanned?: number
          notes?: string | null
          scan_date?: string
          scan_duration_ms?: number | null
          total_dtcs?: number
          vehicle_id?: string | null
          vin?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          modules_scanned?: number
          notes?: string | null
          scan_date?: string
          scan_duration_ms?: number | null
          total_dtcs?: number
          vehicle_id?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dtc_scans_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_mode_enabled: boolean | null
          ai_provider: string | null
          auto_ride_enabled: boolean | null
          auto_start_delay: number | null
          auto_stop_delay: number | null
          average_consumption: number | null
          created_at: string | null
          current_mileage: number | null
          fuel_price: number | null
          fuel_type: string | null
          high_rpm_alert_enabled: boolean | null
          high_temp_alert_enabled: boolean | null
          high_temp_threshold: number | null
          id: string
          keep_awake_enabled: boolean | null
          low_voltage_alert_enabled: boolean | null
          low_voltage_threshold: number | null
          lugging_alert_enabled: boolean | null
          maintenance_alert_enabled: boolean | null
          model_year: string | null
          openai_api_key: string | null
          openai_tts_enabled: boolean | null
          openai_voice: string | null
          redline_rpm: number | null
          refuel_settings: Json | null
          selected_voice_uri: string | null
          shift_light_enabled: boolean | null
          speed_alert_enabled: boolean | null
          speed_limit: number | null
          speed_threshold: number | null
          updated_at: string | null
          vehicle_brand: string | null
          vehicle_cost_per_km: number | null
          vehicle_engine: string | null
          vehicle_model: string | null
          vehicle_nickname: string | null
          vehicle_transmission: string | null
          vin: string | null
          voice_pitch: number | null
          voice_rate: number | null
          voice_volume: number | null
          welcome_enabled: boolean | null
        }
        Insert: {
          ai_mode_enabled?: boolean | null
          ai_provider?: string | null
          auto_ride_enabled?: boolean | null
          auto_start_delay?: number | null
          auto_stop_delay?: number | null
          average_consumption?: number | null
          created_at?: string | null
          current_mileage?: number | null
          fuel_price?: number | null
          fuel_type?: string | null
          high_rpm_alert_enabled?: boolean | null
          high_temp_alert_enabled?: boolean | null
          high_temp_threshold?: number | null
          id: string
          keep_awake_enabled?: boolean | null
          low_voltage_alert_enabled?: boolean | null
          low_voltage_threshold?: number | null
          lugging_alert_enabled?: boolean | null
          maintenance_alert_enabled?: boolean | null
          model_year?: string | null
          openai_api_key?: string | null
          openai_tts_enabled?: boolean | null
          openai_voice?: string | null
          redline_rpm?: number | null
          refuel_settings?: Json | null
          selected_voice_uri?: string | null
          shift_light_enabled?: boolean | null
          speed_alert_enabled?: boolean | null
          speed_limit?: number | null
          speed_threshold?: number | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_cost_per_km?: number | null
          vehicle_engine?: string | null
          vehicle_model?: string | null
          vehicle_nickname?: string | null
          vehicle_transmission?: string | null
          vin?: string | null
          voice_pitch?: number | null
          voice_rate?: number | null
          voice_volume?: number | null
          welcome_enabled?: boolean | null
        }
        Update: {
          ai_mode_enabled?: boolean | null
          ai_provider?: string | null
          auto_ride_enabled?: boolean | null
          auto_start_delay?: number | null
          auto_stop_delay?: number | null
          average_consumption?: number | null
          created_at?: string | null
          current_mileage?: number | null
          fuel_price?: number | null
          fuel_type?: string | null
          high_rpm_alert_enabled?: boolean | null
          high_temp_alert_enabled?: boolean | null
          high_temp_threshold?: number | null
          id?: string
          keep_awake_enabled?: boolean | null
          low_voltage_alert_enabled?: boolean | null
          low_voltage_threshold?: number | null
          lugging_alert_enabled?: boolean | null
          maintenance_alert_enabled?: boolean | null
          model_year?: string | null
          openai_api_key?: string | null
          openai_tts_enabled?: boolean | null
          openai_voice?: string | null
          redline_rpm?: number | null
          refuel_settings?: Json | null
          selected_voice_uri?: string | null
          shift_light_enabled?: boolean | null
          speed_alert_enabled?: boolean | null
          speed_limit?: number | null
          speed_threshold?: number | null
          updated_at?: string | null
          vehicle_brand?: string | null
          vehicle_cost_per_km?: number | null
          vehicle_engine?: string | null
          vehicle_model?: string | null
          vehicle_nickname?: string | null
          vehicle_transmission?: string | null
          vin?: string | null
          voice_pitch?: number | null
          voice_rate?: number | null
          voice_volume?: number | null
          welcome_enabled?: boolean | null
        }
        Relationships: []
      }
      refuel_entries: {
        Row: {
          anomaly_details: string | null
          anomaly_detected: boolean | null
          created_at: string | null
          distance_monitored: number | null
          fuel_level_after: number | null
          fuel_level_before: number | null
          id: string
          liters_added: number
          ltft_delta: number | null
          price_per_liter: number
          pump_accuracy_percent: number | null
          quality: string | null
          stft_average: number | null
          tank_capacity: number | null
          timestamp: string
          total_paid: number
          user_id: string
        }
        Insert: {
          anomaly_details?: string | null
          anomaly_detected?: boolean | null
          created_at?: string | null
          distance_monitored?: number | null
          fuel_level_after?: number | null
          fuel_level_before?: number | null
          id?: string
          liters_added: number
          ltft_delta?: number | null
          price_per_liter: number
          pump_accuracy_percent?: number | null
          quality?: string | null
          stft_average?: number | null
          tank_capacity?: number | null
          timestamp?: string
          total_paid: number
          user_id: string
        }
        Update: {
          anomaly_details?: string | null
          anomaly_detected?: boolean | null
          created_at?: string | null
          distance_monitored?: number | null
          fuel_level_after?: number | null
          fuel_level_before?: number | null
          id?: string
          liters_added?: number
          ltft_delta?: number | null
          price_per_liter?: number
          pump_accuracy_percent?: number | null
          quality?: string | null
          stft_average?: number | null
          tank_capacity?: number | null
          timestamp?: string
          total_paid?: number
          user_id?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          amount_received: number | null
          average_speed: number | null
          cost: number | null
          cost_per_km: number | null
          created_at: string | null
          distance: number | null
          duration: number | null
          end_time: string | null
          id: string
          profit: number | null
          start_time: string
          user_id: string
        }
        Insert: {
          amount_received?: number | null
          average_speed?: number | null
          cost?: number | null
          cost_per_km?: number | null
          created_at?: string | null
          distance?: number | null
          duration?: number | null
          end_time?: string | null
          id?: string
          profit?: number | null
          start_time: string
          user_id: string
        }
        Update: {
          amount_received?: number | null
          average_speed?: number | null
          cost?: number | null
          cost_per_km?: number | null
          created_at?: string | null
          distance?: number | null
          duration?: number | null
          end_time?: string | null
          id?: string
          profit?: number | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_settings: {
        Row: {
          auto_ride_enabled: boolean | null
          auto_start_delay: number | null
          auto_stop_delay: number | null
          average_consumption: number | null
          created_at: string | null
          fuel_price: number | null
          id: string
          speed_threshold: number | null
          updated_at: string | null
          user_id: string
          vehicle_cost_per_km: number | null
        }
        Insert: {
          auto_ride_enabled?: boolean | null
          auto_start_delay?: number | null
          auto_stop_delay?: number | null
          average_consumption?: number | null
          created_at?: string | null
          fuel_price?: number | null
          id?: string
          speed_threshold?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_cost_per_km?: number | null
        }
        Update: {
          auto_ride_enabled?: boolean | null
          auto_start_delay?: number | null
          auto_stop_delay?: number | null
          average_consumption?: number | null
          created_at?: string | null
          fuel_price?: number | null
          id?: string
          speed_threshold?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_cost_per_km?: number | null
        }
        Relationships: []
      }
      vehicle_models: {
        Row: {
          brand: string
          common_issues: Json | null
          created_at: string
          engine_options: Json | null
          id: string
          maintenance_schedule: Json | null
          model_code: string | null
          model_name: string
          popular_parts: Json | null
          updated_at: string
          years_available: string
        }
        Insert: {
          brand: string
          common_issues?: Json | null
          created_at?: string
          engine_options?: Json | null
          id?: string
          maintenance_schedule?: Json | null
          model_code?: string | null
          model_name: string
          popular_parts?: Json | null
          updated_at?: string
          years_available: string
        }
        Update: {
          brand?: string
          common_issues?: Json | null
          created_at?: string
          engine_options?: Json | null
          id?: string
          maintenance_schedule?: Json | null
          model_code?: string | null
          model_name?: string
          popular_parts?: Json | null
          updated_at?: string
          years_available?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          country: string | null
          created_at: string
          id: string
          manufacturer: string | null
          manufacturer_group: string | null
          model_year: string | null
          updated_at: string
          vin: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          manufacturer?: string | null
          manufacturer_group?: string | null
          model_year?: string | null
          updated_at?: string
          vin: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          manufacturer?: string | null
          manufacturer_group?: string | null
          model_year?: string | null
          updated_at?: string
          vin?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
