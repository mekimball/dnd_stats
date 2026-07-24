# 🐉 D&D Stats - Backgrounds Engine

A Ruby on Rails application for loading, parsing, and filtering Dungeons & Dragons (5e) character backgrounds. Built with lightweight, file-backed PORO (Plain Old Ruby Object) models and high-performance Ruby enumerables.

---

## ⚡ Tech Stack

* **Ruby:** 4.0.5
* **Framework:** Ruby on Rails
* **Data Source:** JSON (`config/data/backgrounds.json`)
* **Test Suite:** RSpec
* **Development Environment:** OrbStack / Docker / macOS

---

## 🛠️ Features & Architecture

* **PORO Data Layer:** `Background` model operates without database dependencies for ultra-fast startup and memory efficiency.
* **Memoized Loaders:** Caches JSON parsing in memory (`@all ||= ...`) to eliminate redundant disk reads across search queries.
* **Flexible Search Engine:**
  * Exact match filtering by **Feat**.
  * Array subtraction filtering by selected **Attributes** (e.g., `DEX`, `CON`).
  * Automatic input sanitization (handling blank form arrays and lowercased input).
* **Canonical D&D Attribute Ordering:** Sorts stats matching standard stat blocks (`STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`).

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Ruby 4.0.5 and Bundler installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:mekimball/dnd_stats.git
   cd dnd_stats