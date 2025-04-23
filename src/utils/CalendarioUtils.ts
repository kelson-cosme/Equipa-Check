import { isWeekend, addDays, startOfWeek } from "date-fns";

export function getProximoDiaUtil(data: Date): Date {
  let novaData = new Date(data);
  while (isWeekend(novaData)) {
    novaData = addDays(novaData, 1);
  }
  return novaData;
}

export function getSemanaId(data: Date): string {
  const primeiraSegunda = startOfWeek(data, { weekStartsOn: 1 });
  return `${primeiraSegunda.getFullYear()}-${primeiraSegunda.getMonth()}-${primeiraSegunda.getDate()}`;
}
