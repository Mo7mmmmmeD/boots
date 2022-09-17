const Database = require("st.db");
const { createSpinner } = require("nanospinner");
const { Client, PermissionsBitField, Partials, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { synchronizeSlashCommands, commands } = require("./syncCommands.js");
const config = new Database({ path: "./config.json", databaseInObject: true })
const temporary_db = new Database({ path: "./util/temporary_data.json", databaseInObject: true })
const YouTube = require("youtube-sr").default;

async function checkVoice(queue, client) {
  if (await temporary_db.has(`stay`)) {
    let data = await temporary_db.get(`stay`)
    let guild = await client.guilds.cache.get(data.guild_id)
    let channel = await guild.channels.cache.get(data.channel_id)
    await queue.voices.join(channel).catch(console.error);
  } else {
    await queue.stop().catch(() => { });
    await queue.voices.leave(queue.textChannel.guild);
  }
}

module.exports = async function () {
  console.clear()
  const spinner = createSpinner(`Bot processing by \u001b[32;1mShuruhatik#2443\u001b[0m`).start({ color: 'green' })
  const data_token = await config.get(`token`)
  const token = data_token
  const client = new Client({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    partials: [Partials.GuildScheduledEvent, Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.GuildPresences]
  })
  console.clear()
  client.login(token).then(() => {
    spinner.update({ text: 'Running the bot...' })
  }).catch(() => {
    spinner.error({ text: 'Invalid Bot Token' })
  })
  client.distube = new DisTube(client, { leaveOnStop: false, emitNewSongOnly: false, leaveOnFinish: false, leaveOnStop: false, leaveOnEmpty: false, emitAddSongWhenCreatingQueue: false, emitAddListWhenCreatingQueue: false, plugins: [new YtDlpPlugin({ update: true }), new SoundCloudPlugin(), new SpotifyPlugin()] })
  client.on("ready", async () => {
    await synchronizeSlashCommands(client)
    client.user.setActivity({ name: config.get("status_bot"), type: config.get("status_type") });
    spinner.success({ text: `Logged in as ${client.user.tag} (${client.user.id})`, color: 'bgGreen' })
    console.log("\u001b[32m▣ \u001b[38;5;45;1mMusic\u001b[0m Programmer \u001b[38;5;44;1mMo7mmeD#4979\u001b[0m ")
    setInterval(async () => {
      if (await temporary_db.has(`stay`)) {
        let data = await temporary_db.get(`stay`)
        let guild = await client.guilds.cache.get(data.guild_id)
        let channel = await guild.channels.cache.get(data.channel_id)
        let bot_member = await guild.members.fetch(client.user.id)
        let bot_channel = bot_member.voice && bot_member.voice.channelId ? bot_member.voice : false;
        if (bot_channel == false) return await client.distube.voices.join(channel)
      }
    }, 900000)
  })
  
  client.on("error", console.log)
  client.distube.on("playSong", async (queue, song) => {
    try {
      let data = await temporary_db.get(`${song.user.id}_${queue.textChannel.id}_${queue.voiceChannel.id}`)
      let message = await queue.textChannel.messages.cache.get(data.message_id)
      await message.edit({ content: `🎶 يتم الآن تشغيل الأغنية :\`${song.name}\` - \`${song.formattedDuration}\`` })
    } catch (e) {
      await queue.textChannel.send({ content: `🎶 يتم الآن تشغيل الأغنية :\`${song.name}\` - \`${song.formattedDuration}\`\nبواسطة: ${song.user}` }).then(async (m) => {
        await temporary_db.set(`${song.user.id}_${queue.textChannel.id}_${queue.voiceChannel.id}`, { message_id: m.id })
      })
    }
  });
  client.distube.on("addSong", async (queue, song) => {
    try {
      let data = await temporary_db.get(`${song.user.id}_${queue.textChannel.id}_${queue.voiceChannel.id}`)
      let message = await queue.textChannel.messages.cache.get(data.message_id)
      await message.edit({ content: `🎵 تم اضافته الي قائمة الانتظار :\`${song.name}\` - \`${song.formattedDuration}\`` })
    } catch (e) {
      await queue.textChannel.send({ content: `🎵 تم اضافته الي قائمة الانتظار :\`${song.name}\` - \`${song.formattedDuration}\`\nبواسطة: ${song.user}` }).then(async (m) => {
        await temporary_db.set(`${song.user.id}_${queue.textChannel.id}_${queue.voiceChannel.id}`, { message_id: m.id })
      })
    }
  });
  client.distube.on('error', (channel, e) => {
    if (channel) channel.send(`تمت مصادفة خطأ: ${e}`)
    else console.error(e)
  });
  client.distube.on("addList", async(queue, playlist) => {
    await queue.textChannel.send({ content: `تم اضافة \`${playlist.name}\` قائمة تشغيل (${playlist.songs.length} عدد الاغاني) الي قائمة الانتظار!` })
  });
  client.distube.on("finish", async queue => {
    await queue.textChannel.send({ content: "لا يوجد المزيد من الأغاني في قائمة الانتظار" })
    await checkVoice(queue, client)
  });
  client.distube.on("empty", async queue => await checkVoice(queue, client));
  client.distube.on("noRelated", async queue => await checkVoice(queue, client));
  client.distube.on("disconnect", async queue => await checkVoice(queue, client));
  client.on("interactionCreate", async (interaction) => {
    if (interaction.type == 2) {
      if (!interaction.guild) return;
      if (interaction.commandName == "help") {
        let embeds = [{
          author: { name: "قائمة المساعدة", },
          description: `[ غـا مـبو ل ](https://facebook.com/MOHMED.2003.FUM/)`,
          fields: [{
            name: `أوامر البوت`,
            value: `${commands.map(x => `> \`/${x.name}\` → ${x.description}`).join("\n")}`
          }],
          color: 0x00ff00,
          footer: { text: `Programmer :- غـا مـبو ل` }
        }]
        await interaction.reply({ embeds })
      }
      if (["stop", "loop", "filter", "volume", "replay", "seek", "autoplay", "nowplaying", "playlist", "resume", "pause", "skip", "shuffle", "previous"].some(commandName => interaction.commandName == commandName)) {
        await interaction.deferReply()
        let queue = client.distube.getQueue(interaction);
        if (!queue || queue && !queue.songs[0]) return await interaction.editReply({ embeds: [{ color: 0xff0000, title: `لا يوجد شئ يعمل الان` }] })
        let { channel } = interaction.member.voice;
        if (!channel) return interaction.editReply({ embeds: [{ color: 0xff0000, title: "أنا آسف ولكن يجب أن تكون في روم صوتي لتشغيل الموسيقى!" }] })
        let bot_member = await interaction.guild.members.fetch(client.user.id)
        let bot_channel = bot_member.voice && bot_member.voice.channelId ? bot_member.voice : false;
        if (bot_channel != false && bot_channel.type == 2 && interaction.member.voice.channelId != bot_channel.channelId || bot_channel.type == 13 && interaction.member.voice.channelId != bot_channel.channelId) return interaction.editReply({ embeds: [{ color: 0xff0000, title: "لازم تكون في نفس روم الذي اقوم بتشغيل بيه" }] })
        try {
          if (interaction.commandName == "previous") {
            if (queue.previousSongs.length == 0) {
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `لا توجد أغاني سابقة` }] });
            } else {
              await queue.previous();
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: "جاري تشغيل الاغنية السابقة" }] });
            }
          }
          if (interaction.commandName == "shuffle") {
            await queue.shuffle()
            await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `تم ترتيب الاغاني عشوائيًا في قائمة الانتظار` }] });
          }
          if (interaction.commandName == "playlist") {
            let q = queue.songs.slice(0, 10)
              .map((song, i) => `${i === 0 ? '_تعمل الان :_' : `\`${i}\` -`} **[${song.name}](${song.url})** - \`${song.formattedDuration}\``)
              .join('\n')
            await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `قائمة الانتظار (${queue.songs.length} عدد الاغاني)`, description: `${q || "لا يوجد قائمة انتظار"}${queue.songs.length > 10 ? `\n\n**و ${queue.songs.length - 10} المزيد من الاغاني!**` : ""}` }] })
          }
          if (interaction.commandName == "pause") {
            try {
              queue.pause()
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `تم إيقاف الأغنية مؤقتًا ` }] })
            } catch (x) {
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `الاغنية بالفعل مؤقفه توقيف مؤقتأ` }] })
            }
          }
          if (interaction.commandName == "resume") {
            try {
              queue.resume()
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `تم استأنف الأغنية` }] })
            } catch (x) {
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `الاغنية بالفعل في وضع استأنف` }] })
            }
          }
          if (interaction.commandName == "seek") {
            if (queue.duration < interaction.options.getInteger("input")) return await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `لا يوجد هذا الوقت في الثواني في الاغنية الحالية` }] })
            await queue.seek(interaction.options.getInteger("input"))
            await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `تم تغيير وقت الاغنية الحالي بنجاح` }] })
          }
          if (interaction.commandName == "nowplaying") {
            let mode = `${queue.songs && queue.songs[0].playing ? '⏸️' : '🔘'}`;
            let part = Math.floor((queue.currentTime / queue.songs[0].duration) * 20);
            await interaction.editReply({
              embeds: [{
                title: `🎶 تعمل الان `,
                description: `[${queue.songs[0].name}](${queue.songs[0].url})`,
                thumbnail: { url: queue.songs[0].thumbnail },
                color: 0xf0f0f0,
                fields: [
                  { name: `بواسطة `, value: `${queue.songs[0].user.tag}`, inline: true },
                  { name: `المصدر `, value: `${queue.songs[0].source}`, inline: true },
                  { name: `الفلاتر الحالية`, value: `${queue.filters.names.length <= 0 ? "لا يوجد" : `${queue.filters.names.map(e => `\`${e}\``).join(", ")}`}`, inline: true },
                  { name: `مستوي الصوت `, value: `${Math.floor(queue.volume)}%`, inline: true },
                  { name: `وضح التكرار `, value: `${queue.repeatMode == 2 ? "تكرار كل قائمة الانتظار" : queue.repeatMode == 1 ? "يردد الأغنية" : "معطل"}`, inline: true },
                  { name: `المدة`, value: `\`${queue.formattedCurrentTime}\` [${'▬'.repeat(part)}](${queue.songs[0].url})${`${mode}`}${'▬'.repeat(20 - part)} \`${queue.songs[0].formattedDuration}\``, inline: false }
                ]
              }]
            })
          }
          if (interaction.commandName == "volume") {
            let old = queue.volume
            await queue.setVolume(interaction.options.getInteger("input"))
            await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `تم تغيير مستوى الصوت بنجاح`, fields: [{ name: `مستوي الصوت القديم`, value: `%__${old}__` }, { name: `مستوي الصوت الجديد`, value: `%__${interaction.options.getInteger("input")}__` }] }] })
          }
          if (interaction.commandName == "replay") {
            await queue.seek(0)
            await interaction.editReply({ embeds: [{ color: 0x36393F, title: `🎵 تم اعادة تشغيل الاغنية بنجاح` }] })
          }
          if (interaction.commandName == "autoplay") {
            await queue.toggleAutoplay()
            await interaction.editReply({ embeds: [{ color: 0x36393F, title: queue.autoplay == true ? "تم تفعيل تشغيل الاغاني التلقائي من الاقتراحات للاغنية الاولي لديك" : "تم تعطيل تشغيل الااغاني التلقائي" }] })
          }
          if (interaction.commandName == "stop") {
            queue.stop().then(async () => {
              await interaction.editReply({ embeds: [{ color: 0x36393F, title: `تم ايقاف **الاغنية بنجاح**` }] }).catch(() => { });
              await checkVoice(queue, client)
            })
          }
          if (interaction.commandName == "skip") {
            queue.skip().then(async () => {
              await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: `جاري عمل تخطي للاغنية بنجاح` }] })
            }).catch(async () => {
              await queue.stop().catch(() => { })
              await interaction.editReply({ embeds: [{ color: 0x36393F, title: `تم ايقاف **الاغنية بنجاح**` }] }).catch(() => { });
              await checkVoice(queue, client);
            })
          }
          if (interaction.commandName == "filter") {
            if (interaction.options.getString("type_of_filter") == "clear") {
              await interaction.editReply({ embeds: [{ color: 0x36393F, title: `تم حذف جميع فلاتر بنجاح` }] })
              await queue.filters.clear()
            } else {
              await queue.filters.add(interaction.options.getString("type_of_filter"))
              await interaction.editReply({ embeds: [{ color: 0x36393F, title: `تم اضافة علي الاغنية فلتر الذي قومت بوضعه بنجاح`, description: `الفلاتر الحالية:\n\`\`\`${queue.filters.names.length <= 0 ? "لا يوجد" : `${queue.filters.names.map(e => `${e}`).join(", ")}`}\`\`\`` }] })
            }
          }
          if (interaction.commandName == "loop") {
            await queue.setRepeatMode(+interaction.options.getString("repeat_mode"))
            await interaction.editReply({ embeds: [{ color: 0xf0f0f0, title: interaction.options.getString("repeat_mode") == 0 ? "تم الغاء الحلقة تكرارية علي الاغنية بنجاح" : interaction.options.getString("repeat_mode") == 2 ? "تم تفعيل حلقة تكرارية علي قائمة الاغاني بنجاح" : "تم تفعيل حلقة تكرارية علي الاغنية بنجاح" }] }).catch(() => { })
          }
        } catch (x) {
          console.error(x)
          await interaction.editReply({ ephemeral: true, embeds: [{ color: 0xff0000, title: `حدث خطا ما في تنفيذ طلبك ` }] }).catch(() => { });
        }
      }
      if (interaction.commandName == "stay") {
        if (!interaction.member.permissions.has("ADMINISTRATOR")) return await interaction.reply({ content: `لا يمكننك القيام بهذا الأمر :x:`, ephemeral: true })
        if (interaction.options.getBoolean("disable") && interaction.options.getBoolean("disable") == true) {
          if (!await temporary_db.has(`stay`)) return await interaction.reply({ embeds: [{ color: 0xff0000, title: `لا يوجد تثبيت للبوت في روم صوتي بالفعل!` }] })
          await temporary_db.delete(`stay`)
          return await interaction.reply({ embeds: [{ color: 0xff0000, title: `تم تعطيل تثبيت من الروم بنجاح` }] });
        }
        let { channel } = interaction.member.voice;
        if (!channel) return interaction.reply({ embeds: [{ color: 0xff0000, title: "أنا آسف ولكن يجب أن تكون في روم صوتي لتشغيل الموسيقى!" }] })
        await temporary_db.set(`stay`, { guild_id: interaction.guild.id, channel_id: channel.id })
        await interaction.reply({ embeds: [{ color: 0xf0f0f0, description: `**تم تثبيت البوت في الروم الصوتي <#${channel.id}> بنجاح ✅**` }] })
      }
      if (interaction.commandName == "play") {
        let { channel } = interaction.member.voice;
        if (!channel) return interaction.reply({ embeds: [{ color: 0xff0000, title: "أنا آسف ولكن يجب أن تكون في روم صوتي لتشغيل الموسيقى!" }] })
        let bot_member = await interaction.guild.members.fetch(client.user.id)
        let bot_channel = bot_member.voice && bot_member.voice.channelId ? bot_member.voice : false;
        if (bot_channel != false && bot_member.voice.channelId != null && interaction.member.voice.channelId != bot_channel.channelId) return interaction.reply({ embeds: [{ color: 0xff0000, title: "يجب ان تكون في نفس الروم الخاص بي" }] })
        if (bot_channel != false && bot_channel.type == 2 && interaction.member.voice.channelId != bot_channel.channelId || bot_channel.type == 13 && interaction.member.voice.channelId != bot_channel.channelId) return interaction.reply({ ephemeral: true, embeds: [{ color: 0xff0000, title: "لازم تكون في نفس روم الذي اقوم بتشغيل بيه" }] })
        if (!bot_member.permissionsIn(channel).has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) return interaction.reply({ ephemeral: true, embeds: [{ description: `لا يمكنني الاتصال بالروم الصوتي الخاص بك ، تأكد من أن لدي الأذونات المناسبة!`, color: 0xff0000 }] });
        try {
          await interaction.reply(`🔍 **جاري البحث.....** \`${interaction.options.getString("search")}\``)
          let m = await interaction.fetchReply()
          await temporary_db.set(`${interaction.user.id}_${interaction.channel.id}_${interaction.member.voice.channelId}`, { message_id: m.id })
          await client.distube.play(interaction.member.voice.channel, interaction.options.getString("search"), { member: interaction.member, textChannel: interaction.channel, message: interaction.message })
        } catch (e) {
          await interaction.editReply({ embeds: [{ color: 0xff0000, title: `فشل في بحث عن المطلوب تاكد من انه مدعوم في البوت` }] }).catch(() => { });
        }
      }
    }
    if (interaction.type == 4 && interaction.commandName == "play" && interaction.options && interaction.options.getString("search")) {
      let youtube = await YouTube.search(interaction.options.getString("search"), { safeSearch: true, limit: 25 })
      let getSuggestions = []
      youtube.forEach(x => {
        getSuggestions.push({ name: x.title, value: x.url })
      })
      await interaction.respond(getSuggestions)
        .catch(() => { })
    }
  })
}
