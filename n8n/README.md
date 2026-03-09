# n8n

Os arquivos desta pasta ajudam a transformar o payload do formulario em um objeto limpo para gerar um `.docx`.

## Code node

Use [code-node-clean-equipment-request.js](/home/raave/form-it/n8n/code-node-clean-equipment-request.js) em um node `Code` do n8n logo depois do `Webhook`.

- Modo recomendado: `Run Once for All Items`
- Entrada aceita:
  - item bruto do `Webhook`, com `body`
  - ou o proprio `body`, se voce ja tiver removido o envelope antes

## Saida principal

O node retorna um item limpo com estes campos:

- `request_id`
- `submitted_at_br`
- `requester_*`
- `future_user_*`
- `justification`
- `notes` (legado, opcional)
- `equipment_summary`
- `item_count`
- `total_units`
- `has_replacement_items`
- `equipments`
- `equipments_block`
- `replacement_equipments_block`

## Como usar no DOCX

Voce tem dois caminhos:

1. Template com repeticao

Use o array `equipments` para montar uma tabela ou bloco repetido no template. Cada item traz:

- `index`
- `equipment_label`
- `equipment_profile_label`
- `equipment_profile_description`
- `quantity`
- `is_replacement_label`
- `replacement_reason`
- `previous_equipment_disposition`
- `previous_equipment_summary`

2. Template simples

Se o node de `.docx` nao suportar loop, use `equipments_block` em um unico placeholder. Ele gera um texto como:

```text
1. 1x Notebook
Perfil: Intermediario - Vostro com mais RAM e CPU
Indicado para: Power BI, analise de dados, multiplas planilhas, multitarefa pesada e AutoCAD.
Substituicao: Sim
Motivo da substituicao: Equipamento antigo
Destino do equipamento anterior: Devolver ao TI
Dados do equipamento anterior: Modelo: Dell Vostro | Patrimonio: PIP000001

2. 1x Celular
Requisitos tecnicos: Celular padrao
Substituicao: Nao
```

## Observacoes de limpeza

O script:

- remove valores vazios como `N/A`, `null`, `undefined`, `-`
- converte data para `pt-BR`
- consolida o resumo dos equipamentos anteriores
- gera blocos prontos para pedido com um ou varios itens
