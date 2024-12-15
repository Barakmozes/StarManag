export const tableData = [
  {
    tableNumber: 1,
    diners: 10,
    area: 'Patio',
    reserved: true,
    specialRequests: ['Near the fountain', 'No direct sunlight'],
  },
  {
    tableNumber: 2,
    diners: 4,
    area: 'Main Hall',
    reserved: false,
  },
  {
    tableNumber: 3,
    diners: 6,
    area: 'Private Room',
    reserved: true,
    specialRequests: ['Quiet environment', 'Birthday decorations'],
  },
  {
    tableNumber: 4,
    diners: 3,
    area: 'Balcony',
    reserved: false,
  },
  ...Array.from({ length: 46 }, (_, i) => {
    const tableNumber = i + 5;
    const diners = [2, 3, 4, 6][Math.floor(Math.random() * 4)];
    const area = ['Patio', 'Main Hall', 'Private Room', 'Balcony', 'Garden'][
      Math.floor(Math.random() * 5)
    ];
    const reserved = Math.random() > 0.5;
    const specialRequests =
      reserved && Math.random() > 0.7
        ? ['Quiet environment', 'Birthday decorations', 'Near the fountain'][
            Math.floor(Math.random() * 3)
          ]
        : undefined;

    return {
      tableNumber,
      diners,
      area,
      reserved,
      specialRequests: specialRequests ? [specialRequests] : [],
    };
  }),
];

