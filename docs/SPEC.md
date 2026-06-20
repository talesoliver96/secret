# The Secret Burger

Sistema web para lanchonete com pedidos por QR Code na mesa.

## Stack

- Frontend: React + Vite + JavaScript
- Backend: Node.js + Express
- Banco: Supabase/PostgreSQL
- Auth admin: JWT
- Cliente: mobile-first, dark, secreto, elegante
- Admin: claro, azul, estilo Google UI

## Módulos

### Cliente

- Acessa `/mesa/:numero`
- Visualiza cardápio
- Adiciona itens ao carrinho
- Informa nome e telefone
- Finaliza pedido
- Vê confirmação do pedido

### Admin

- Login
- Dashboard
- Pedidos
- Clientes
- Produtos
- Categorias
- Mesas
- Configurações

## Status do pedido

- recebido
- preparando
- pronto
- entregue
- cancelado

## Regras

- Pedido precisa ter pelo menos 1 item.
- Nome e telefone são obrigatórios.
- Cliente é identificado pelo telefone.
- Total do pedido é calculado no backend.
- Produto indisponível não aparece para cliente.
- Admin pode editar status, pedido, cliente e cardápio.

## Banco

Tabelas:

- admins
- customers
- tables
- categories
- products
- product_options
- orders
- order_items
- order_item_options
- settings