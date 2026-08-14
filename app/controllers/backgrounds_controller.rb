class BackgroundsController < ApplicationController
  def index
    @all_attributes = Background.all_attributes
    @all_feats = Background.all_feats

    @search_mode = params[:search_mode] || "attributes"
    @selected_attrs = Array(params[:attributes]).take(3)
    @selected_feat = params[:feat]

    @backgrounds = Background.search(
      search_mode: @search_mode,
      selected_attrs: @selected_attrs,
      selected_feat: @selected_feat
    )
  end
end
