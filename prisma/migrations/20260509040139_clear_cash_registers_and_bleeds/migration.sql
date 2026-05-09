-- Migration para limpar todos os caixas e sangrias existentes

-- Apagar todas as sangrias
DELETE FROM "CashBleed";

-- Apagar todas as entradas de dinheiro
DELETE FROM "CashEntry";

-- Apagar todos os caixas
DELETE FROM "CashRegister";