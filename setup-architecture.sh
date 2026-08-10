#!/bin/bash

echo "🚀 Création de l'architecture backend..."

# Dossiers principaux
mkdir -p src/common
mkdir -p src/config
mkdir -p src/modules
mkdir -p src/prisma

# Common
mkdir -p src/common/decorators
mkdir -p src/common/dto
mkdir -p src/common/enums
mkdir -p src/common/exceptions
mkdir -p src/common/filters
mkdir -p src/common/guards
mkdir -p src/common/interceptors
mkdir -p src/common/pipes
mkdir -p src/common/types
mkdir -p src/common/utils

# Config
mkdir -p src/config/database
mkdir -p src/config/graphql
mkdir -p src/config/firebase
mkdir -p src/config/redis
mkdir -p src/config/jwt

# Modules métier
mkdir -p src/modules/auth
mkdir -p src/modules/users
mkdir -p src/modules/restaurants
mkdir -p src/modules/menus
mkdir -p src/modules/orders
mkdir -p src/modules/parcels
mkdir -p src/modules/deliveries
mkdir -p src/modules/drivers
mkdir -p src/modules/tracking
mkdir -p src/modules/notifications
mkdir -p src/modules/payments
mkdir -p src/modules/partners
mkdir -p src/modules/dashboard

# Tests
mkdir -p test

# Documentatikdir -p docs

echo "✅ Architecture créée avec succès !"
