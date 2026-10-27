/** Canonical owner-supplied document. Do not flatten or reconstruct it from cards.
 * Unrendered sections remain intact for subsequent turns and version restores.
 */
export interface MotherProduct {
  item_id: string;
  product_name_generic: string;
  category: string;
  subcategory: string;
  recommendation_type: string;
  product_role: string;
  visual_problem_solved: string[];
  related_issue_ids: string[];
  why_needed: string;
  placement_instruction: string;
  render_visibility_requirement: string;
  search_brief: {
    fa_keywords: string[]; en_keywords: string[]; preferred_colors: string[];
    preferred_materials: string[]; preferred_shapes: string[]; style_tags: string[];
    avoid_attributes: string[];
  };
  shopping_attributes: {
    effort_level: string; price_sensitivity: string; replace_existing: boolean;
    replaces_existing_item_id: string | null; installation_needed: boolean;
    must_be_visible_in_render: boolean;
  };
  scores: {
    impact_score: number; purchase_priority: string; render_visibility: string;
    placement_confidence: string; recommendation_confidence: string;
  };
}

export interface StudioMotherDocument {
  room_type_detection: Record<string, unknown>;
  improvement_mode: Record<string, unknown>;
  change_intensity: Record<string, unknown>;
  visible_scope_analysis: Record<string, unknown>;
  identity_driven_design: Record<string, unknown>;
  room_analysis: Record<string, unknown>;
  improvement_strategy: Record<string, unknown>;
  existing_items_decision: Record<string, unknown>[];
  layout_fix_plan: Record<string, unknown>[];
  product_recommendations: MotherProduct[];
  renderer_ready_instructions: Record<string, unknown>;
  user_facing_summary: {
    positive_diagnosis: string; main_improvement_idea: string; top_changes: string[];
    why_these_changes_work: string; expected_visual_result: string; shopping_message: string;
  };
  /** Intended design checks, NOT measurements of the generated image. */
  render_execution_check: Record<string, unknown>;
  quality_checks: Record<string, unknown>;
}
