const EMPTY_SENTINELS = new Set([
  "",
  "-",
  "--",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
]);

function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  if (EMPTY_SENTINELS.has(normalized.toLowerCase())) {
    return "";
  }

  return normalized;
}

function cleanNumber(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue;
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function joinNonEmpty(parts, separator) {
  return parts.filter(Boolean).join(separator);
}

function extractPayload(item) {
  if (item && typeof item === "object" && item.body && typeof item.body === "object") {
    return item.body;
  }

  return item ?? {};
}

function buildPreviousEquipmentSummary(previousEquipment) {
  if (!previousEquipment || typeof previousEquipment !== "object") {
    return "";
  }

  const parts = [
    cleanText(previousEquipment.model)
      ? `Modelo: ${cleanText(previousEquipment.model)}`
      : "",
    cleanText(previousEquipment.assetTag)
      ? `Patrimonio: ${cleanText(previousEquipment.assetTag)}`
      : "",
    cleanText(previousEquipment.serialNumber)
      ? `Serie: ${cleanText(previousEquipment.serialNumber)}`
      : "",
    cleanText(previousEquipment.phoneNumber)
      ? `Linha: ${cleanText(previousEquipment.phoneNumber)}`
      : "",
    cleanText(previousEquipment.notes)
      ? `Observacoes: ${cleanText(previousEquipment.notes)}`
      : "",
  ];

  return joinNonEmpty(parts, " | ");
}

function buildEquipmentRow(item, index) {
  const equipmentLabel =
    cleanText(item.equipmentLabel) || cleanText(item.equipmentType) || "Equipamento";
  const quantity = cleanNumber(item.quantity, 1);
  const equipmentProfile = cleanText(item.equipmentProfile);
  const equipmentProfileLabel = cleanText(item.equipmentProfileLabel);
  const equipmentProfileDescription = cleanText(item.equipmentProfileDescription);
  const technicalRequirements = cleanText(item.technicalRequirements);
  const isReplacement = Boolean(item.isReplacement);
  const replacementReason = cleanText(item.replacementReason);
  const previousDisposition = cleanText(
    item.previousEquipmentDisposition?.label ?? item.previousEquipmentDisposition?.value,
  );
  const previousEquipmentSummary = buildPreviousEquipmentSummary(item.previousEquipment);

  const replacementLines = isReplacement
    ? [
        "Substituicao: Sim",
        replacementReason ? `Motivo da substituicao: ${replacementReason}` : "",
        previousDisposition
          ? `Destino do equipamento anterior: ${previousDisposition}`
          : "",
        previousEquipmentSummary
          ? `Dados do equipamento anterior: ${previousEquipmentSummary}`
          : "",
      ]
    : ["Substituicao: Nao"];

  return {
    index: index + 1,
    equipment_type: cleanText(item.equipmentType),
    equipment_label: equipmentLabel,
    equipment_profile: equipmentProfile,
    equipment_profile_label: equipmentProfileLabel,
    equipment_profile_description: equipmentProfileDescription,
    quantity,
    technical_requirements: technicalRequirements,
    is_replacement: isReplacement,
    is_replacement_label: isReplacement ? "Sim" : "Nao",
    replacement_reason: replacementReason,
    previous_equipment_disposition: previousDisposition,
    previous_equipment_summary: previousEquipmentSummary,
    previous_equipment_model: cleanText(item.previousEquipment?.model),
    previous_equipment_asset_tag: cleanText(item.previousEquipment?.assetTag),
    previous_equipment_serial_number: cleanText(item.previousEquipment?.serialNumber),
    previous_equipment_phone_number: cleanText(item.previousEquipment?.phoneNumber),
    previous_equipment_notes: cleanText(item.previousEquipment?.notes),
    docx_line: joinNonEmpty(
      [
        `${index + 1}. ${quantity}x ${equipmentLabel}`,
        equipmentProfileLabel ? `Perfil: ${equipmentProfileLabel}` : "",
        equipmentProfileDescription
          ? `Indicado para: ${equipmentProfileDescription}`
          : technicalRequirements
            ? `Requisitos tecnicos: ${technicalRequirements}`
          : "",
        ...replacementLines,
      ],
      "\n",
    ),
  };
}

function normalizeEquipmentRequest(payload) {
  const source = extractPayload(payload);
  const rawItems = Array.isArray(source.items) ? source.items : [];
  const equipments = rawItems.map(buildEquipmentRow);
  const replacementEquipments = equipments.filter((item) => item.is_replacement);
  const totalUnits =
    cleanNumber(source.totals?.totalUnits) ||
    equipments.reduce((total, item) => total + item.quantity, 0);

  const requesterBlock = joinNonEmpty(
    [
      cleanText(source.requester?.name),
      cleanText(source.requester?.roleLabel ?? source.requester?.role),
      cleanText(source.requester?.department),
      cleanText(source.requester?.email),
      cleanText(source.requester?.phone),
    ],
    "\n",
  );

  const futureUserBlock = joinNonEmpty(
    [
      cleanText(source.futureUser?.name),
      cleanText(source.futureUser?.cpf)
        ? `CPF: ${cleanText(source.futureUser?.cpf)}`
        : "",
      cleanText(source.futureUser?.employeeId)
        ? `Matricula: ${cleanText(source.futureUser?.employeeId)}`
        : "",
      cleanText(source.futureUser?.jobTitle),
      cleanText(source.futureUser?.department),
      cleanText(source.futureUser?.location),
      cleanText(source.futureUser?.email),
    ],
    "\n",
  );

  return {
    request_id: cleanText(source.requestId),
    submitted_at_iso: cleanText(source.submittedAt),
    submitted_at_br: formatDateTime(source.submittedAt),
    organization_name: cleanText(source.organization?.name),
    submitted_by_name: cleanText(source.submittedBy?.name),
    submitted_by_email: cleanText(source.submittedBy?.email),
    requester_name: cleanText(source.requester?.name),
    requester_email: cleanText(source.requester?.email),
    requester_role: cleanText(
      source.requester?.roleLabel ?? source.requester?.role,
    ),
    requester_department: cleanText(source.requester?.department),
    requester_phone: cleanText(source.requester?.phone),
    requester_block: requesterBlock,
    future_user_name: cleanText(source.futureUser?.name),
    future_user_email: cleanText(source.futureUser?.email),
    future_user_cpf: cleanText(source.futureUser?.cpf),
    future_user_employee_id: cleanText(source.futureUser?.employeeId),
    future_user_department: cleanText(source.futureUser?.department),
    future_user_job_title: cleanText(source.futureUser?.jobTitle),
    future_user_location: cleanText(source.futureUser?.location),
    future_user_block: futureUserBlock,
    justification: cleanText(source.justification),
    notes: cleanText(source.notes),
    equipment_summary:
      cleanText(source.summary) ||
      joinNonEmpty(
        equipments.map((item) => `${item.quantity}x ${item.equipment_label}`),
        ", ",
      ),
    item_count: equipments.length,
    total_units: totalUnits,
    has_replacement_items: replacementEquipments.length > 0,
    has_replacement_items_label:
      replacementEquipments.length > 0 ? "Sim" : "Nao",
    equipments,
    equipments_block: joinNonEmpty(
      equipments.map((item) => item.docx_line),
      "\n\n",
    ),
    replacement_equipments_block: joinNonEmpty(
      replacementEquipments.map((item) => item.docx_line),
      "\n\n",
    ),
  };
}

return items.map((item) => ({
  json: normalizeEquipmentRequest(item.json),
}));
