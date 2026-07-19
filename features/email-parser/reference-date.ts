export class ExtractionReferenceDateError extends Error {
  constructor() {
    super('A valid device timezone is required for email extraction.');
    this.name = 'ExtractionReferenceDateError';
  }
}

export function resolveDeviceTimeZone(
  resolver: () => string | undefined = () =>
    Intl.DateTimeFormat().resolvedOptions().timeZone,
): string {
  const timeZone = resolver()?.trim();
  if (!timeZone) throw new ExtractionReferenceDateError();

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    throw new ExtractionReferenceDateError();
  }

  return timeZone;
}

export function deriveReferenceDate(
  now: Date,
  timeZone: string,
  formatterFactory: typeof Intl.DateTimeFormat = Intl.DateTimeFormat,
): string {
  if (Number.isNaN(now.getTime())) throw new ExtractionReferenceDateError();

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new formatterFactory('en-US-u-ca-gregory-nu-latn', {
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
  } catch {
    throw new ExtractionReferenceDateError();
  }

  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get('year');
  const month = values.get('month');
  const day = values.get('day');
  if (
    !year ||
    !month ||
    !day ||
    !/^\d{4}$/.test(year) ||
    !/^\d{2}$/.test(month) ||
    !/^\d{2}$/.test(day)
  ) {
    throw new ExtractionReferenceDateError();
  }

  return `${year}-${month}-${day}`;
}
