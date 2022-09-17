const { ApplicationCommand } = require('discord.js');
const commands = [{
  name: "help",
  description: "لرؤية أوامر البوت",
  type: 1,
}, {
  name: "stop",
  description: "لإيقاف الموسيقى ومسح قائمة الانتظار",
  type: 1,
}, {
  name: "previous",
  description: "يقوم بتشغيل الأغنية السابقة في قائمة الانتظار.",
  type: 1,
}, {
  name: "shuffle",
  description: "تبديل قائمة الانتظار الحالية عشوائيًا.",
  type: 1,
}, {
  name: "autoplay",
  description: "تشغيل الاغاني من مقترحات الاغنيه الاولى بدون الحاجه لتشغيلها يدويا",
  type: 1,
  options: [{
    name: `mode`,
    description: `هل تريد تفعيل الاغاني من مقترحات؟`,
    required: true,
    type: 5
  }]
}, {
  name: "skip",
  description: "يتخطى الأغنية الحالية.",
  type: 1,
}, {
  name: "stay",
  description: "تثبيت البوت في روم صوتي",
  type: 1,
  options: [{
    name: `disable`,
    description: `هل تريد تعطيل تثبيت البوت في روم صوتي أم لا؟`,
    required: false,
    type: 5
  }]
}, {
  name: "pause",
  description: "يوقف الأغنية الحالية مؤقتًا.",
  type: 1,
}, {
  name: "playlist ",
  description: "اعرض قائمة الانتظار",
  type: 1,
}, {
  name: "nowplaying",
  description: "يعرض الأغنية الحالية قيد التشغيل.",
  type: 1,
}, {
  name: "resume",
  description: "يستأنف الموسيقى",
  type: 1,
}, {
  name: "replay",
  description: "يعيد تشغيل الأغنية الحالية",
  type: 1,
}, {
  name: 'volume',
  description: `يغير مستوي صوت تشغيل الموسيقى.`,
  options: [{
    name: `input`,
    description: `قوم بكتابة مستوي الصوت بين 1 الي 100`,
    required: true,
    type: 4,
    minValue: 1,
    maxValue: 100
  }]
}, {
  name: 'seek',
  description: `لتشغيل الاغنية من وقت ثواني محدد`,
  options: [{
    name: `input`,
    description: `قوم بكتابة الوقت بالثواني`,
    required: true,
    type: 4,
    minValue: 1
  }]
}, {
  name: 'play',
  description: `قم بتشغيل أغنية أو إضافتها إلى قائمة الانتظار`,
  options: [{
    name: `search`,
    description: `البحث أو وضع رابط الاغنية`,
    required: true,
    type: 3,
    autocomplete: true
  }]
}, {
  name: 'loop',
  description: `تكرار الأغنية في قائمة الانتظار.`,
  options: [{
    name: `repeat_mode`,
    description: `اختر نوع التكرار الذي تريده`,
    required: true,
    type: 3,
    choices: [
      {
        name: `تعطيل`,
        value: `0`
      },
      {
        name: `الاغنية`,
        value: `1`
      },
      {
        name: `قائمة الانتظار`,
        value: `2`
      },
    ]
  }]
}, {
  name: 'filter',
  description: `وضع فلتر علي الاغنية اذا كنت تريد`,
  options: [{
    name: `type_of_filter`,
    description: `اختر نوع الفلتر الذي تريده`,
    required: true,
    type: 3,
    choices: [
      { name: 'حذف جميع الفلاتر علي قائمة الانتظار', value: 'clear' },
      { name: 'ثلاثي الأبعاد', value: '3d' },
      { name: 'تضخيم الصوت', value: 'bassboost' },
      { name: 'صدى صوت', value: 'echo' },
      { name: 'شفير', value: 'flanger' },
      { name: 'بوابة الهواء', value: 'gate' },
      { name: 'فلتر هواء', value: 'haas' },
      { name: 'كاريوكي', value: 'karaoke' },
      { name: 'Nightcore', value: 'nightcore' },
      { name: 'يعكس', value: 'reverse' },
      { name: 'فابورويف ', value: 'vaporwave' },
      { name: 'Mcompand', value: 'mcompand' },
      { name: 'Phaser', value: 'phaser' },
      { name: 'اهتزاز', value: 'tremolo' },
      { name: 'صوت محيط', value: 'surround' },
      { name: 'شمع الأذن', value: 'earwax' }]
  }]
}]

module.exports.commands = commands
module.exports.synchronizeSlashCommands = async function (client) {
  client.application.commands.fetch().then(async currentCommands => {
    let newCommands = commands.filter((command) => !currentCommands.some((c) => c.name === command.name));
    for (let newCommand of newCommands) {
      await client.application.commands.create(newCommand);
    }
    let updatedCommands = commands.filter((command) => currentCommands.some((c) => c.name === command.name));
    let updatedCommandCount = 0;
    for (let updatedCommand of updatedCommands) {
      const previousCommand = currentCommands.find((c) => c.name === updatedCommand.name);
      const newCommand = updatedCommand;
      let modified = false;
      if (previousCommand.description !== newCommand.description) modified = true;
      if (!ApplicationCommand.optionsEqual(previousCommand.options ?? [], newCommand.options ?? [])) modified = true;
      if (modified) {
        await previousCommand.edit(newCommand);
        updatedCommandCount++;
      }
    }
    let deletedCommands = currentCommands.filter((command) => !commands.some((c) => c.name === command.name)).toJSON();
    for (let deletedCommand of deletedCommands) {
      await deletedCommand.delete();
    }
  })
};