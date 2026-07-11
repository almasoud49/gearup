import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log(' Seeding GearUp database...');

    await prisma.review.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.rentalOrder.deleteMany({});
    await prisma.gearItem.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});    

    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@gearup.com',
            password: await bcrypt.hash('admin123', 12),
            role: 'ADMIN',
        },
    });

    const customer = await prisma.user.create({
        data: {
            name: 'John Customer',
            email: 'john@customer.com',
            password: await bcrypt.hash('Password123', 12),
            role: 'CUSTOMER',
        },
    });

    const provider = await prisma.user.create({
        data: {
            name: 'John Provider',
            email: 'john@provider.com',
            password: await bcrypt.hash('Password123', 12),
            role: 'PROVIDER',
        },
    });

    const categories = {
        cycling: await prisma.category.create({ data: { name: 'Cycling', description: 'Bicycles and cycling gear' } }),
        camping: await prisma.category.create({ data: { name: 'Camping', description: 'Camping and outdoor gear' } }),
        fitness: await prisma.category.create({ data: { name: 'Fitness', description: 'Gym equipment and fitness accessories' } }),
        waterSports: await prisma.category.create({ data: { name: 'Water Sports', description: 'Kayaks, paddleboards, and water gear' } }),
        winterSports: await prisma.category.create({ data: { name: 'Winter Sports', description: 'Skis, snowboards, and winter gear' } }),
        hiking: await prisma.category.create({ data: { name: 'Hiking', description: 'Backpacks, boots, and hiking gear' } }),
        teamSports: await prisma.category.create({ data: { name: 'Team Sports', description: 'Football, basketball, and team sports' } }),
        yoga: await prisma.category.create({ data: { name: 'Yoga & Wellness', description: 'Yoga mats and wellness accessories' } }),
        running: await prisma.category.create({ data: { name: 'Running', description: 'Running shoes and apparel' } }),
        climbing: await prisma.category.create({ data: { name: 'Climbing', description: 'Climbing ropes and safety gear' } }),
        golf: await prisma.category.create({ data: { name: 'Golf', description: 'Golf clubs and accessories' } }),
        skateboarding: await prisma.category.create({ data: { name: 'Skateboarding', description: 'Skateboards and protective gear' } }),
        surfing: await prisma.category.create({ data: { name: 'Surfing', description: 'Surfboards and wetsuits' } }),
        scubaDiving: await prisma.category.create({ data: { name: 'Scuba Diving', description: 'Diving equipment and gear' } }),
        archery: await prisma.category.create({ data: { name: 'Archery', description: 'Bows, arrows, and targets' } }),
        martialArts: await prisma.category.create({ data: { name: 'Martial Arts', description: 'Training gear and equipment' } }),
        dance: await prisma.category.create({ data: { name: 'Dance', description: 'Dance shoes and apparel' } }),
        childrenSports: await prisma.category.create({ data: { name: "Children's Sports", description: "Kids' sports equipment" } }),
        petSports: await prisma.category.create({ data: { name: 'Pet Sports', description: 'Pet sports and agility gear' } }),
        outdoorAdventures: await prisma.category.create({ data: { name: 'Outdoor Adventures', description: 'Adventure and survival gear' } }),
        otherSports: await prisma.category.create({ data: { name: 'Other Sports', description: 'Miscellaneous sports equipment' } }),
    };

    await prisma.gearItem.create({
        data: {
            name: 'Mountain Bike Pro',
            description: 'Full suspension mountain bike for rough terrains',
            pricePerDay: 35.99,
            brand: 'Trek',
            stockQuantity: 3,
            images: ['https://example.com/images/mountain-bike.jpg'],
            specifications: { frame: 'Aluminum', suspension: 'Full', wheels: '29 inch' },
            categoryId: categories.cycling.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Road Bike Elite',
            description: 'Lightweight carbon fiber road bike for speed',
            pricePerDay: 45.99,
            brand: 'Specialized',
            stockQuantity: 2,
            images: ['https://example.com/images/road-bike.jpg'],
            specifications: { frame: 'Carbon Fiber', weight: '8.5kg', wheels: '700c' },
            categoryId: categories.cycling.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Camping Tent - 4 Person',
            description: 'Waterproof dome tent for family camping',
            pricePerDay: 19.99,
            brand: 'Coleman',
            stockQuantity: 5,
            images: ['https://example.com/images/tent.jpg'],
            specifications: { capacity: '4 Persons', waterproof: true, weight: '5.5kg' },
            categoryId: categories.camping.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Sleeping Bag - 3 Season',
            description: 'Comfortable sleeping bag for spring, summer, and fall',
            pricePerDay: 8.99,
            brand: 'Marmot',
            stockQuantity: 15,
            images: ['https://example.com/images/sleeping-bag.jpg'],
            specifications: { temperature: '10°C to 20°C', season: '3 Season' },
            categoryId: categories.camping.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Camping Stove - 2 Burner',
            description: 'Portable camping stove for outdoor cooking',
            pricePerDay: 12.99,
            brand: 'Coleman',
            stockQuantity: 8,
            images: ['https://example.com/images/stove.jpg'],
            specifications: { burners: 2, fuelType: 'Propane', BTU: '20,000' },
            categoryId: categories.camping.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Adjustable Dumbbells Set',
            description: 'Adjustable dumbbells 5-50kg for home gym',
            pricePerDay: 12.99,
            brand: 'Bowflex',
            stockQuantity: 3,
            images: ['https://example.com/images/dumbbells.jpg'],
            specifications: { weightRange: '5-50kg', material: 'Cast Iron' },
            categoryId: categories.fitness.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Yoga Mat Premium',
            description: 'Non-slip eco-friendly yoga mat',
            pricePerDay: 4.99,
            brand: 'Lululemon',
            stockQuantity: 20,
            images: ['https://example.com/images/yoga-mat.jpg'],
            specifications: { material: 'Natural Rubber', thickness: '5mm' },
            categoryId: categories.fitness.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Inflatable Kayak - 2 Person',
            description: 'Kayak with paddles and pump for water adventures',
            pricePerDay: 35.99,
            brand: 'Intex',
            stockQuantity: 3,
            images: ['https://example.com/images/kayak.jpg'],
            specifications: { capacity: '2 Persons', material: 'PVC', weight: '12kg' },
            categoryId: categories.waterSports.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Stand-Up Paddleboard',
            description: 'Inflatable SUP with pump and paddle',
            pricePerDay: 29.99,
            brand: 'iRocker',
            stockQuantity: 4,
            images: ['https://example.com/images/paddleboard.jpg'],
            specifications: { length: '10\'6"', width: '32"', weightCapacity: '275 lbs' },
            categoryId: categories.waterSports.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Snowboard Pro',
            description: 'Professional snowboard with bindings',
            pricePerDay: 29.99,
            brand: 'Burton',
            stockQuantity: 3,
            images: ['https://example.com/images/snowboard.jpg'],
            specifications: { length: '158cm', type: 'All-Mountain', profile: 'Camber' },
            categoryId: categories.winterSports.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Ski Set - Professional',
            description: 'Ski set with boots and poles',
            pricePerDay: 39.99,
            brand: 'Salomon',
            stockQuantity: 2,
            images: ['https://example.com/images/ski.jpg'],
            specifications: { length: '170cm', includes: 'Boots, Poles' },
            categoryId: categories.winterSports.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Hiking Backpack - 60L',
            description: 'Large backpack for multi-day hikes',
            pricePerDay: 14.99,
            brand: 'Osprey',
            stockQuantity: 7,
            images: ['https://example.com/images/backpack.jpg'],
            specifications: { capacity: '60L', weight: '2.3kg', hydrationCompatible: true },
            categoryId: categories.hiking.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Running Shoes - Professional',
            description: 'Lightweight shoes for long-distance running',
            pricePerDay: 9.99,
            brand: 'Nike',
            stockQuantity: 10,
            images: ['https://example.com/images/running-shoes.jpg'],
            specifications: { cushioning: 'Responsive', weight: '250g' },
            categoryId: categories.running.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Yoga Block - Set of 2',
            description: 'Eco-friendly yoga blocks for support',
            pricePerDay: 2.99,
            brand: 'Manduka',
            stockQuantity: 25,
            images: ['https://example.com/images/yoga-block.jpg'],
            specifications: { material: 'Cork', size: '23cm x 15cm x 10cm' },
            categoryId: categories.yoga.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Climbing Rope - 60m',
            description: 'Dynamic climbing rope for indoor/outdoor',
            pricePerDay: 15.99,
            brand: 'Petzl',
            stockQuantity: 5,
            images: ['https://example.com/images/climbing-rope.jpg'],
            specifications: { length: '60m', diameter: '9.8mm', type: 'Dynamic' },
            categoryId: categories.climbing.id,
            providerId: provider.id,
        },
    });

    await prisma.gearItem.create({
        data: {
            name: 'Football - Professional',
            description: 'Professional football for matches',
            pricePerDay: 5.99,
            brand: 'Adidas',
            stockQuantity: 15,
            images: ['https://example.com/images/football.jpg'],
            specifications: { size: 5, material: 'Synthetic' },
            categoryId: categories.teamSports.id,
            providerId: provider.id,
        },
    });

    const gear = await prisma.gearItem.findFirst();
    
    if (gear) {
        const rental = await prisma.rentalOrder.create({
            data: {
                startDate: new Date('2026-07-20T00:00:00.000Z'),
                endDate: new Date('2026-07-25T00:00:00.000Z'),
                totalPrice: 179.95,
                customerId: customer.id,
                gearItemId: gear.id,
                status: 'PLACED',
            },
        });

        await prisma.payment.create({
            data: {
                transactionId: 'pi_sample_test_123456789',
                amount: 179.95,
                method: 'STRIPE',
                status: 'COMPLETED',
                paidAt: new Date(),
                rentalOrderId: rental.id,
            },
        });

        await prisma.rentalOrder.update({
            where: { id: rental.id },
            data: { status: 'RETURNED' },
        });

        await prisma.review.create({
            data: {
                rating: 5,
                comment: 'Excellent gear! Highly recommended.',
                customerId: customer.id,
                gearItemId: gear.id,
            },
        });
    }
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });