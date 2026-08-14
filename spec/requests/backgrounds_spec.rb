require 'rails_helper'

RSpec.describe 'Backgrounds', type: :request do
  describe 'GET /backgrounds' do
    it 'returns a successful HTTP response' do
      get backgrounds_path
      expect(response).to have_http_status(:ok)
    end

    it 'renders the background sorter page with standard elements' do
      get backgrounds_path
      expect(response.body).to include('D&D 2024 Background Finder')
      expect(response.body).to include('Search by Attributes')
    end

    it 'filters backgrounds by attribute params' do
      get backgrounds_path, params: { search_mode: 'attributes', attributes: [ 'STR', 'DEX', 'CON' ] }
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Soldier')
    end

    it 'filters backgrounds by origin feat params' do
      get backgrounds_path, params: { search_mode: 'feat', feat: 'Alert' }
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Criminal')
    end
  end
end
