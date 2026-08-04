require 'rails_helper'

RSpec.describe Background, type: :model do
  describe '#initialize' do
    it 'assigns reader attributes from a hash' do
      data = {
        'name' => 'Criminal',
        'attributes' => ['DEX', 'CON', 'INT'],
        'feat' => 'Alert',
        'description' => 'Experienced in surviving outside the law.'
      }

      bg = Background.new(data)

      expect(bg.name).to eq('Criminal')
      expect(bg.attributes).to eq(['DEX', 'CON', 'INT'])
      expect(bg.feat).to eq('Alert')
      expect(bg.description).to eq('Experienced in surviving outside the law.')
    end

    it 'defaults attributes to an empty array if missing' do
      bg = Background.new({ 'name' => 'Unknown' })
      expect(bg.attributes).to eq([])
    end
  end

  describe '.all' do
    it 'returns an array of Background instances loaded from JSON' do
      backgrounds = Background.all

      expect(backgrounds).not_to be_empty
      expect(backgrounds).to all(be_a(Background))
    end
  end

  describe '.find' do
    it 'finds a background by id' do
      bg = Background.find('soldier')
      expect(bg).not_to be_nil
      expect(bg.name).to eq('Soldier')
    end

    it 'finds a background by parameterized name' do
      bg = Background.find('criminal')
      expect(bg).not_to be_nil
      expect(bg.name).to eq('Criminal')
    end

    it 'returns nil for blank or non-existent IDs' do
      expect(Background.find(nil)).to be_nil
      expect(Background.find('')).to be_nil
      expect(Background.find('invalid_id')).to be_nil
    end
  end

  describe '.all_attributes' do
    it 'returns the standard 6 D&D attribute abbreviations' do
      expect(Background.all_attributes).to eq(%w[STR DEX CON INT WIS CHA])
    end
  end

  describe '.all_feats' do
    it 'returns a sorted, unique list of all feat names from the dataset' do
      feats = Background.all_feats

      expect(feats).to be_an(Array)
      expect(feats).not_to be_empty
      expect(feats).to eq(feats.uniq.sort)
    end
  end

  describe '.search' do
    context "when search_mode is 'feat'" do
      it 'filters backgrounds matching the selected feat exactly' do
        results = Background.search(search_mode: 'feat', selected_feat: 'Alert')

        expect(results).not_to be_empty
        expect(results.map(&:feat)).to all(eq('Alert'))
      end

      it 'returns all backgrounds if selected_feat is blank' do
        results = Background.search(search_mode: 'feat', selected_feat: '')

        expect(results.count).to eq(Background.all.count)
      end
    end

    context "when search_mode is 'attributes'" do
      it 'filters backgrounds containing all selected attributes' do
        results = Background.search(search_mode: 'attributes', selected_attrs: ['DEX', 'CON'])

        expect(results).not_to be_empty
        results.each do |bg|
          expect(bg.attributes).to include('DEX', 'CON')
        end
      end

      it 'handles lowercase inputs and normalizes to uppercase' do
        results = Background.search(search_mode: 'attributes', selected_attrs: ['dex'])

        expect(results).not_to be_empty
        results.each do |bg|
          expect(bg.attributes).to include('DEX')
        end
      end

      it 'ignores blank strings in selected_attrs array' do
        results = Background.search(search_mode: 'attributes', selected_attrs: ['DEX', ''])

        expect(results).not_to be_empty
        results.each do |bg|
          expect(bg.attributes).to include('DEX')
        end
      end
    end
  end

  describe '#as_json' do
    it 'returns a hash suitable for JSON serialization' do
      bg = Background.find('soldier')
      json = bg.as_json

      expect(json['name']).to eq('Soldier')
      expect(json['feat']).to eq('Savage Attacker')
      expect(json['attributes']).to include('STR', 'DEX', 'CON')
    end
  end
end