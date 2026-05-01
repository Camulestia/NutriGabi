import { Consultation, MealPlan, Patient } from "@/lib/types";

const baseConsultations: Consultation[] = [
  {
    id: "cons-001",
    patientId: "pat-001",
    createdAt: "2026-03-12T10:30:00.000Z",
    objective: "Redução de gordura corporal com preservação de massa magra",
    chiefComplaint: "Cansaço no fim do dia e dificuldade para organizar refeições",
    anamnesis: {
      recall24h: "Café com pão francês; almoço fora; lanche ausente; jantar tardio.",
      foodFrequency: "Baixa ingestão de frutas e vegetais durante a semana.",
      waterIntake: "1,3 L/dia",
      foodRestriction: "Redução de lactose por desconforto abdominal.",
      vegetarianPattern: "Não",
      celiacDisease: "Nega",
      supplements: "Whey protein esporádico",
      gastrointestinalSymptoms: "Distensão abdominal pós-jantar",
      sleep: "5-6h/noite, com despertares",
      physicalActivity: "Musculação 3x/semana"
    },
    anthropometry: {
      currentWeight: 78.2,
      habitualWeight: 84,
      desiredWeight: 72,
      height: 1.66,
      waist: 90,
      hip: 106,
      arm: 31,
      calf: 37,
      wrist: 16,
      skinfolds: {
        tricipital: 24,
        subscapular: 28,
        suprailiac: 31,
        abdominal: 34
      }
    },
    semiology: {
      hairs: { label: "Cabelos", severity: "leve", observation: "Relata queda aumentada." },
      skin: { label: "Pele", severity: "normal", observation: "Sem alterações relevantes." },
      nails: { label: "Unhas", severity: "leve", observation: "Fragilidade distal." },
      oralMucosa: { label: "Mucosa oral", severity: "normal", observation: "Hidratada." },
      eyes: { label: "Olhos", severity: "normal", observation: "Sem palidez evidente." },
      edema: { label: "Edema", severity: "normal", observation: "Ausente." },
      muscleMass: { label: "Massa muscular", severity: "leve", observation: "Boa reserva, porém sedentarismo prévio." },
      adiposeTissue: { label: "Tecido adiposo", severity: "moderado", observation: "Acúmulo central perceptível." }
    },
    bioimpedance: {
      bodyFatPercent: 34.8,
      fatMass: 27.2,
      leanMass: 51,
      muscleMass: 27.8,
      totalBodyWater: 36.4,
      intracellularWater: 21.3,
      extracellularWater: 15.1,
      visceralFat: 12,
      phaseAngle: 5.6,
      bmr: 1490
    },
    labExam: {
      vitaminD: "24 ng/mL",
      b12: "322 pg/mL",
      iron: "58 ug/dL",
      ferritin: "29 ng/mL",
      zinc: "74 ug/dL",
      folate: "7.8 ng/mL",
      glucose: "98 mg/dL",
      insulin: "15 uIU/mL",
      homaIr: "3.6",
      lipidProfile: "CT 205 / HDL 45 / LDL 129 / TG 156",
      crp: "0.7 mg/dL",
      tshT4: "TSH 2.1 / T4L 1.0",
      albumin: "4.2 g/dL",
      notes: "Coletados em março de 2026."
    },
    aiInterpretation: {
      summary:
        "O conjunto de dados sugere padrão de adiposidade central, hidratação subótima e possível impacto de rotina alimentar irregular sobre composição corporal e sintomas gastrointestinais.",
      keyFindings: [
        "Relação cintura-quadril elevada para vigilância metabólica.",
        "Sono curto e omissão de refeições podem estar associados à fome compensatória noturna.",
        "HOMA-IR aumentado sugere necessidade de acompanhamento do controle glicêmico."
      ],
      nutritionalRisks: [
        "Maior risco cardiometabólico",
        "Baixa ingestão de micronutrientes reguladores",
        "Perda de adesão por rotina profissional intensa"
      ],
      possibleDeficiencies: [
        "Vitamina D limítrofe",
        "Estoques de ferro em faixa que merecem acompanhamento",
        "B12 suficiente, porém sem grande margem"
      ],
      correlations: [
        "Baixo consumo hídrico + distensão abdominal pode influenciar hábito intestinal.",
        "Sono inadequado + gordura visceral aumentada pode estar associado à piora do apetite."
      ],
      attentionPoints: [
        "Reforçar planejamento alimentar diurno.",
        "Avaliar resposta de sintomas ao ajuste de lactose e fibras."
      ],
      conductSuggestions: [
        "Organizar 3 refeições principais com 1 lanche estruturado.",
        "Meta hídrica progressiva até 2,1 L/dia.",
        "Priorizar proteína em café da manhã e jantar."
      ],
      nextConsultationSuggestions: [
        "Reavaliar cintura, gordura visceral e adesão hídrica.",
        "Comparar sintomas gastrointestinais após 30 dias."
      ],
      generatedAt: "2026-03-12T11:15:00.000Z"
    },
    professionalDiagnosis: "Excesso de adiposidade central com rotina alimentar irregular.",
    conduct: "Planejamento alimentar progressivo com foco em saciedade, hidratação e proteína.",
    goals: "Reduzir 3 cm de cintura em 8 semanas e melhorar energia diária.",
    followUp: "Retorno em 30 dias."
  },
  {
    id: "cons-002",
    patientId: "pat-001",
    createdAt: "2026-04-18T14:00:00.000Z",
    objective: "Consolidar redução de medidas e melhorar disposição",
    chiefComplaint: "Ainda sente fome no fim da tarde, porém com menos inchaço",
    anamnesis: {
      recall24h: "Omelete; almoço com marmita; iogurte; jantar com arroz, feijão e frango.",
      foodFrequency: "Melhora de frutas e vegetais em 5 dias da semana.",
      waterIntake: "1,9 L/dia",
      foodRestriction: "Lactose moderada",
      vegetarianPattern: "Não",
      celiacDisease: "Nega",
      supplements: "Whey 4x/semana",
      gastrointestinalSymptoms: "Menor distensão, evacuação regular",
      sleep: "6-7h/noite",
      physicalActivity: "Musculação 4x/semana + caminhada 2x"
    },
    anthropometry: {
      currentWeight: 75.6,
      habitualWeight: 84,
      desiredWeight: 72,
      height: 1.66,
      waist: 85,
      hip: 104,
      arm: 30,
      calf: 37.5,
      wrist: 16,
      skinfolds: {
        tricipital: 22,
        subscapular: 25,
        suprailiac: 28,
        abdominal: 31
      }
    },
    semiology: {
      hairs: { label: "Cabelos", severity: "leve", observation: "Queda menor." },
      skin: { label: "Pele", severity: "normal", observation: "Boa hidratação." },
      nails: { label: "Unhas", severity: "leve", observation: "Sem piora." },
      oralMucosa: { label: "Mucosa oral", severity: "normal", observation: "Normal." },
      eyes: { label: "Olhos", severity: "normal", observation: "Sem alterações." },
      edema: { label: "Edema", severity: "normal", observation: "Ausente." },
      muscleMass: { label: "Massa muscular", severity: "normal", observation: "Preservada." },
      adiposeTissue: { label: "Tecido adiposo", severity: "leve", observation: "Redução do acúmulo abdominal." }
    },
    bioimpedance: {
      bodyFatPercent: 32.4,
      fatMass: 24.5,
      leanMass: 51.1,
      muscleMass: 28.2,
      totalBodyWater: 37.8,
      intracellularWater: 22.1,
      extracellularWater: 15.7,
      visceralFat: 10,
      phaseAngle: 5.9,
      bmr: 1502
    },
    labExam: {
      vitaminD: "29 ng/mL",
      b12: "341 pg/mL",
      iron: "64 ug/dL",
      ferritin: "34 ng/mL",
      zinc: "78 ug/dL",
      folate: "8.1 ng/mL",
      glucose: "93 mg/dL",
      insulin: "11 uIU/mL",
      homaIr: "2.5",
      lipidProfile: "CT 192 / HDL 47 / LDL 118 / TG 134",
      crp: "0.5 mg/dL",
      tshT4: "TSH 2.0 / T4L 1.1",
      albumin: "4.3 g/dL",
      notes: "Controle após 5 semanas."
    },
    professionalDiagnosis: "Evolução favorável com melhora de composição corporal.",
    conduct: "Manter organização alimentar e ajustar lanche da tarde.",
    goals: "Sustentar redução de gordura e ampliar qualidade do sono.",
    followUp: "Retorno em 45 dias."
  }
];

export const mockPatients: Patient[] = [
  {
    id: "pat-001",
    name: "Mariana Costa",
    birthDate: "1991-08-14",
    sex: "Feminino",
    phone: "(85) 99876-2101",
    email: "mariana.costa@email.com",
    profession: "Advogada",
    mainObjective: "Emagrecimento com melhora de energia",
    chiefComplaint: "Dificuldade em manter rotina alimentar e distensão abdominal",
    clinicalHistory: "Resistência insulínica prévia, sem internações, histórico familiar de diabetes tipo 2.",
    medications: "Metformina 500mg 2x/dia",
    supplements: "Whey protein e vitamina D eventual",
    foodRestrictions: "Redução de lactose",
    preferredFoods: ["iogurte", "frango", "banana"],
    rejectedFoods: ["fígado"],
    allergies: [],
    intolerances: ["lactose"],
    culturalPreferences: "",
    foodNotes: "Prefere refeições práticas para levar ao trabalho e lanches portáteis.",
    notes: "Paciente engajada, prefere orientações práticas para rotina de trabalho.",
    consultations: baseConsultations,
    reports: [
      {
        id: "rep-001",
        consultationId: "cons-001",
        createdAt: "2026-03-12T11:20:00.000Z",
        title: "Relatório inicial"
      }
    ]
  },
  {
    id: "pat-002",
    name: "João Pedro Lima",
    birthDate: "1985-11-03",
    sex: "Masculino",
    phone: "(85) 99711-4422",
    email: "joaopedro@email.com",
    profession: "Professor",
    mainObjective: "Ganho de massa magra",
    chiefComplaint: "Baixo apetite pela manhã",
    clinicalHistory: "Sem comorbidades relevantes.",
    medications: "Nega",
    supplements: "Creatina 5g/dia",
    foodRestrictions: "Nenhuma",
    preferredFoods: ["ovo", "frango", "arroz"],
    rejectedFoods: [],
    allergies: [],
    intolerances: [],
    culturalPreferences: "",
    foodNotes: "Treina muito cedo e costuma comer melhor no almoço e no jantar.",
    notes: "Treina cedo.",
    consultations: [],
    reports: []
  }
];

export const mockMealPlans: MealPlan[] = [
  {
    id: "plan-001",
    patientId: "pat-001",
    consultationId: "cons-002",
    title: "Plano alimentar - rotina de trabalho",
    goal: "Reduzir gordura corporal com melhor distribuição proteica durante o dia",
    strategy: "emagrecimento",
    status: "ativo",
    targetCalories: 1750,
    targetProtein: 130,
    targetCarbs: 175,
    targetFat: 58,
    meals: [
      {
        id: "meal-001",
        name: "Café da manhã",
        time: "07:00",
        order: 0,
        notes: "Priorizar preparo rápido.",
        items: [
          {
            id: "item-001",
            foodId: "food-egg",
            name: "Ovo",
            quantity: 2,
            unit: "unidade",
            calories: 143,
            protein: 13,
            carbs: 0.7,
            fat: 9.5,
            fibers: 0,
            group: "Proteínas",
            tags: ["proteína", "gordura"],
            notes: "",
            substitutions: []
          },
          {
            id: "item-002",
            foodId: "food-bread",
            name: "Pão francês",
            quantity: 1,
            unit: "unidade",
            calories: 150,
            protein: 4,
            carbs: 29,
            fat: 1.6,
            fibers: 1.2,
            group: "Panificados",
            tags: ["carboidrato"],
            notes: "",
            substitutions: []
          }
        ]
      },
      {
        id: "meal-002",
        name: "Almoço",
        time: "12:30",
        order: 1,
        notes: "",
        items: [
          {
            id: "item-003",
            foodId: "food-rice",
            name: "Arroz cozido",
            quantity: 120,
            unit: "g",
            calories: 153.6,
            protein: 3,
            carbs: 33.7,
            fat: 0.4,
            fibers: 1.9,
            group: "Cereais e tubérculos",
            tags: ["carboidrato"],
            notes: "",
            substitutions: []
          },
          {
            id: "item-004",
            foodId: "food-beans",
            name: "Feijão cozido",
            quantity: 100,
            unit: "g",
            calories: 76,
            protein: 4.8,
            carbs: 13.6,
            fat: 0.5,
            fibers: 8.5,
            group: "Leguminosas",
            tags: ["carboidrato", "proteína", "fibra", "leguminosa"],
            notes: "",
            substitutions: []
          },
          {
            id: "item-005",
            foodId: "food-chicken",
            name: "Frango grelhado",
            quantity: 140,
            unit: "g",
            calories: 231,
            protein: 43.4,
            carbs: 0,
            fat: 5,
            fibers: 0,
            group: "Proteínas",
            tags: ["proteína"],
            notes: "",
            substitutions: []
          }
        ]
      }
    ],
    notes: "Plano inicial com foco em praticidade e saciedade.",
    internalNotes: "Revisar lanche da tarde na próxima consulta.",
    createdAt: "2026-04-18T15:00:00.000Z",
    updatedAt: "2026-04-18T15:00:00.000Z",
    professionalReviewRequired: true
  }
];
