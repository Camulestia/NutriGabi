import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.userProfile.upsert({
    where: { clerkUserId: "dev-seed-user" },
    update: {
      email: "dev@nutriconsulta.local",
      name: "Usuário de desenvolvimento",
      plan: "pro"
    },
    create: {
      clerkUserId: "dev-seed-user",
      email: "dev@nutriconsulta.local",
      name: "Usuário de desenvolvimento",
      plan: "pro"
    }
  });

  const patient = await prisma.patient.upsert({
    where: { id: "seed-patient-001" },
    update: {
      userId: user.id,
      name: "Paciente Seed",
      birthDate: new Date("1990-01-15"),
      age: 36,
      sex: "Feminino",
      phone: "(85) 99999-0000",
      email: "paciente.seed@email.com",
      profession: "Analista",
      mainGoal: "Organizar rotina alimentar",
      mainComplaint: "Falta de constância nas refeições",
      clinicalHistory: "Sem histórico relevante para o seed.",
      medications: "Nega",
      supplements: "Nega",
      foodRestrictions: "Nenhuma",
      notes: "Registro criado pelo seed de desenvolvimento.",
      preferredFoods: ["frango", "banana"],
      rejectedFoods: ["fígado"],
      allergies: [],
      intolerances: [],
      culturalPreferences: "",
      foodNotes: "Usar apenas para validar integração local."
    },
    create: {
      id: "seed-patient-001",
      userId: user.id,
      name: "Paciente Seed",
      birthDate: new Date("1990-01-15"),
      age: 36,
      sex: "Feminino",
      phone: "(85) 99999-0000",
      email: "paciente.seed@email.com",
      profession: "Analista",
      mainGoal: "Organizar rotina alimentar",
      mainComplaint: "Falta de constância nas refeições",
      clinicalHistory: "Sem histórico relevante para o seed.",
      medications: "Nega",
      supplements: "Nega",
      foodRestrictions: "Nenhuma",
      notes: "Registro criado pelo seed de desenvolvimento.",
      preferredFoods: ["frango", "banana"],
      rejectedFoods: ["fígado"],
      allergies: [],
      intolerances: [],
      culturalPreferences: "",
      foodNotes: "Usar apenas para validar integração local."
    }
  });

  await prisma.appointment.create({
    data: {
      userId: user.id,
      patientId: patient.id,
      patientName: patient.name,
      date: new Date(),
      time: "09:00",
      reason: "Retorno",
      type: "retorno",
      status: "agendada",
      notes: "Agendamento seed"
    }
  }).catch(() => null);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    console.error("Seed falhou.");
    await prisma.$disconnect();
    process.exit(1);
  });
