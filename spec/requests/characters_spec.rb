require 'rails_helper'

RSpec.describe 'Characters', type: :request do
  let!(:character) do
    Character.create!(
      name: 'Gimli',
      level: 1,
      character_class_id: 'fighter',
      species_id: 'human',
      background_id: 'soldier',
      strength: 15,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 8
    )
  end

  let(:valid_params) do
    {
      character: {
        name: 'Legolas',
        level: 3,
        character_class_id: 'fighter',
        species_id: 'elf',
        background_id: 'guide',
        subclass_id: 'champion',
        strength: 10,
        dexterity: 16,
        constitution: 14,
        intelligence: 12,
        wisdom: 12,
        charisma: 10,
        ability_boosts: { 'dexterity' => 2, 'wisdom' => 1 },
        skill_proficiencies: ['perception', 'survival'],
        equipment: ['Studded Leather Armor', 'Longbow & 20 Arrows']
      }
    }
  end

  let(:invalid_params) do
    {
      character: {
        name: '',
        character_class_id: '',
        species_id: ''
      }
    }
  end

  describe 'GET /characters (index)' do
    it 'renders a successful response listing all characters' do
      get characters_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Gimli')
    end
  end

  describe 'GET /characters/:id (show)' do
    it 'renders the character sheet' do
      get character_path(character)
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Gimli')
      expect(response.body).to include('Level 1')
    end
  end

  describe 'GET /characters/new' do
    it 'renders the new character form' do
      get new_character_path
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Create New Character')
    end
  end

  describe 'POST /characters (create)' do
    context 'with valid parameters' do
      it 'creates a new Character and redirects to show' do
        expect {
          post characters_path, params: valid_params
        }.to change(Character, :count).by(1)

        new_char = Character.last
        expect(response).to redirect_to(character_path(new_char))
        expect(flash[:notice]).to eq('Legolas was successfully created!')
      end
    end

    context 'with invalid parameters' do
      it 'does not create a character and renders :new with unprocessable_entity' do
        expect {
          post characters_path, params: invalid_params
        }.not_to change(Character, :count)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe 'GET /characters/:id/edit' do
    it 'renders the edit character form' do
      get edit_character_path(character)
      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Edit Character')
    end
  end

  describe 'PATCH /characters/:id (update)' do
    context 'with valid parameters' do
      it 'updates the character and redirects to show' do
        patch character_path(character), params: { character: { name: 'Gimli Son of Gloin', level: 2 } }
        character.reload

        expect(character.name).to eq('Gimli Son of Gloin')
        expect(character.level).to eq(2)
        expect(response).to redirect_to(character_path(character))
        expect(flash[:notice]).to eq('Gimli Son of Gloin was successfully updated!')
      end
    end

    context 'with invalid parameters' do
      it 'renders :edit with unprocessable_entity' do
        patch character_path(character), params: { character: { name: '' } }
        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe 'DELETE /characters/:id (destroy)' do
    it 'deletes the character and redirects to index' do
      expect {
        delete character_path(character)
      }.to change(Character, :count).by(-1)

      expect(response).to redirect_to(characters_path)
      expect(response).to have_http_status(:see_other)
      expect(flash[:notice]).to eq('Gimli was deleted.')
    end
  end
end