const { Telegraf, Markup } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const { Concert } = require("../models/concerts.model");

const initBot = () => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const localSession = new LocalSession({
    database: "session_db.json",
    property: "session",
    storage: LocalSession.storageMemory,
    format: {
      serialize: (obj) => JSON.stringify(obj, null, 2),
      deserialize: (str) => JSON.parse(str),
    },
  });

  bot.use(localSession.middleware());

  bot.use((ctx, next) => {
    if (!ctx.session) {
      ctx.session = {};
    }
    return next();
  });

  bot.start(async (ctx) => {
    const welcomeMessage = `🎵 *BAKR LANDING* 🎵

🔧 *Админка для управления данными*

Добро пожаловать в панель администратора!
Выберите раздел для управления:`;

    const sentMessage = await ctx.reply(welcomeMessage, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🎤 Концерты", "concerts")],
        [Markup.button.callback("🎶 Музыки", "music")],
      ]),
    });

    ctx.session.messageId = sentMessage.message_id;
    ctx.session.chatId = ctx.chat.id;
  });

  bot.action("concerts", async (ctx) => {
    const concertsMessage = `🎤 *Управление концертами*

Выберите действие:`;

    try {
      await ctx.editMessageText(concertsMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("➕ Добавить концерт", "add_concert")],
          [Markup.button.callback("📋 Список концертов", "list_concerts")],
          [Markup.button.callback("✏️ Редактировать", "edit_concert")],
          [Markup.button.callback("🗑 Удалить", "delete_concert")],
          [Markup.button.callback("🔙 Назад в главное меню", "main_menu")],
        ]),
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("music", async (ctx) => {
    const musicMessage = `🎶 *Управление музыкой*

Выберите действие:`;

    try {
      await ctx.editMessageText(musicMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("➕ Добавить музыку", "add_music")],
          [Markup.button.callback("📋 Список музыки", "list_music")],
          [Markup.button.callback("✏️ Редактировать", "edit_music")],
          [Markup.button.callback("🗑 Удалить", "delete_music")],
          [Markup.button.callback("🔙 Назад в главное меню", "main_menu")],
        ]),
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("main_menu", async (ctx) => {
    const welcomeMessage = `🎵 *BAKR LANDING* 🎵

🔧 *Админка для управления данными*

Добро пожаловать в панель администратора!
Выберите раздел для управления:`;

    try {
      await ctx.editMessageText(welcomeMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🎤 Концерты", "concerts")],
          [Markup.button.callback("🎶 Музыки", "music")],
        ]),
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("add_concert", async (ctx) => {
    const addConcertMessage = `🎤 *Добавить новый концерт*

Введите данные в следующем формате:
📅 Дата (ГГГГ-ММ-ДД)
🏙️ Город
🏛️ Учреждение
🔗 Ссылка

Пример:
2024-12-25
Бишкек
Филармония
https://example.com/tickets`;

    try {
      await ctx.editMessageText(addConcertMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Назад к концертам", "concerts")],
        ]),
      });
      await ctx.answerCbQuery();
      ctx.session.waitingFor = "concert_data";
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("list_concerts", async (ctx) => {
    try {
      const concerts = await Concert.find().sort({ plannedTo: 1 });

      let listMessage = `🎤 *Список концертов*\n\n`;

      if (concerts.length === 0) {
        listMessage += `(Пока список пуст)\n\nЗдесь будут отображаться все добавленные концерты.`;
      } else {
        concerts.forEach((concert, index) => {
          const date = new Date(concert.plannedTo).toLocaleDateString("ru-RU");
          listMessage += `${index + 1}. *ID:* ${concert.concertId}\n`;
          listMessage += `📅 *Дата:* ${date}\n`;
          listMessage += `🏙️ *Город:* ${concert.cityOn}\n`;
          listMessage += `🏛️ *Учреждение:* ${concert.institutionOn}\n`;
          listMessage += `🔗 [Ссылка](${concert.linkTo})\n\n`;
        });
      }

      await ctx.editMessageText(listMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔄 Обновить список", "list_concerts")],
          [Markup.button.callback("🔙 Назад к концертам", "concerts")],
        ]),
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.log("Ошибка получения концертов:", error.message);
      await ctx.answerCbQuery("❌ Ошибка при загрузке списка концертов");
    }
  });

  bot.action("add_music", async (ctx) => {
    const addMusicMessage = `🎶 *Добавить новую музыку*

Введите название композиции:`;

    try {
      await ctx.editMessageText(addMusicMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Назад к музыке", "music")],
        ]),
      });
      await ctx.answerCbQuery();
      ctx.session.waitingFor = "music_name";
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("list_music", async (ctx) => {
    const listMessage = `🎶 *Список музыки*

(Пока список пуст)

Здесь будут отображаться все добавленные композиции.`;

    try {
      await ctx.editMessageText(listMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Назад к музыке", "music")],
        ]),
      });
      await ctx.answerCbQuery();
    } catch (error) {
      console.log("Ошибка редактирования:", error.message);
    }
  });

  bot.action("delete_concert", async (ctx) => {
    try {
      const concerts = await Concert.find().sort({ plannedTo: 1 });

      if (concerts.length === 0) {
        await ctx.answerCbQuery("❌ Нет концертов для удаления");
        return;
      }

      let deleteMessage = `🗑 *Удаление концерта*\n\nВведите ID концерта для удаления:\n\n`;

      concerts.forEach((concert) => {
        const date = new Date(concert.plannedTo).toLocaleDateString("ru-RU");
        deleteMessage += `🆔 *${concert.concertId}* - ${date} в ${concert.cityOn}\n`;
      });

      await ctx.editMessageText(deleteMessage, {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Назад к концертам", "concerts")],
        ]),
      });
      await ctx.answerCbQuery();
      ctx.session.waitingFor = "delete_concert_id";
    } catch (error) {
      console.log("Ошибка загрузки концертов для удаления:", error.message);
      await ctx.answerCbQuery("❌ Ошибка при загрузке списка концертов");
    }
  });

  bot.action(/edit_/, async (ctx) => {
    try {
      await ctx.answerCbQuery("⚠️ Функция редактирования в разработке");
    } catch (error) {
      console.log("Ошибка:", error.message);
    }
  });

  bot.on("text", async (ctx) => {
    if (ctx.session.waitingFor) {
      const text = ctx.message.text;

      if (ctx.session.waitingFor === "concert_data") {
        try {
          const lines = text.trim().split("\n");

          if (lines.length < 4) {
            await ctx.reply(
              "❌ Неправильный формат! Введите все 4 строки:\n1. Дата\n2. Город\n3. Учреждение\n4. Ссылка"
            );
            return;
          }

          const [dateStr, city, institution, link] = lines;

          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            await ctx.reply(
              "❌ Неправильный формат даты! Используйте ГГГГ-ММ-ДД (например: 2024-12-25)"
            );
            return;
          }

          if (!link.startsWith("http")) {
            await ctx.reply(
              "❌ Ссылка должна начинаться с http:// или https://"
            );
            return;
          }

          const newConcert = new Concert({
            plannedTo: date,
            cityOn: city.trim(),
            institutionOn: institution.trim(),
            linkTo: link.trim(),
          });

          await newConcert.save();

          await ctx.reply(
            `✅ Концерт успешно добавлен!\n\n📅 Дата: ${date.toLocaleDateString(
              "ru-RU"
            )}\n🏙️ Город: ${city}\n🏛️ Учреждение: ${institution}\n🆔 ID: ${
              newConcert.concertId
            }`
          );

          ctx.session.waitingFor = null;

          setTimeout(async () => {
            try {
              await bot.telegram.editMessageText(
                ctx.session.chatId,
                ctx.session.messageId,
                null,
                `🎤 *Управление концертами*\n\nВыберите действие:`,
                {
                  parse_mode: "Markdown",
                  ...Markup.inlineKeyboard([
                    [
                      Markup.button.callback(
                        "➕ Добавить концерт",
                        "add_concert"
                      ),
                    ],
                    [
                      Markup.button.callback(
                        "📋 Список концертов",
                        "list_concerts"
                      ),
                    ],
                    [
                      Markup.button.callback(
                        "✏️ Редактировать",
                        "edit_concert"
                      ),
                    ],
                    [Markup.button.callback("🗑 Удалить", "delete_concert")],
                    [
                      Markup.button.callback(
                        "🔙 Назад в главное меню",
                        "main_menu"
                      ),
                    ],
                  ]),
                }
              );
            } catch (error) {
              console.log("Ошибка обновления меню:", error.message);
            }
          }, 3000);
        } catch (error) {
          console.log("Ошибка сохранения концерта:", error.message);
          await ctx.reply(
            "❌ Ошибка при сохранении концерта. Попробуйте еще раз."
          );
        }
      } else if (ctx.session.waitingFor === "delete_concert_id") {
        try {
          const concertId = parseInt(text);

          if (isNaN(concertId)) {
            await ctx.reply("❌ Введите корректный ID концерта (число)");
            return;
          }

          const deletedConcert = await Concert.findOneAndDelete({
            concertId: concertId,
          });

          if (!deletedConcert) {
            await ctx.reply("❌ Концерт с таким ID не найден");
            return;
          }

          await ctx.reply(
            `✅ Концерт удален!\n\n🆔 ID: ${
              deletedConcert.concertId
            }\n📅 Дата: ${new Date(deletedConcert.plannedTo).toLocaleDateString(
              "ru-RU"
            )}\n🏙️ Город: ${deletedConcert.cityOn}`
          );

          ctx.session.waitingFor = null;

          setTimeout(async () => {
            try {
              await bot.telegram.editMessageText(
                ctx.session.chatId,
                ctx.session.messageId,
                null,
                `🎤 *Управление концертами*\n\nВыберите действие:`,
                {
                  parse_mode: "Markdown",
                  ...Markup.inlineKeyboard([
                    [
                      Markup.button.callback(
                        "➕ Добавить концерт",
                        "add_concert"
                      ),
                    ],
                    [
                      Markup.button.callback(
                        "📋 Список концертов",
                        "list_concerts"
                      ),
                    ],
                    [
                      Markup.button.callback(
                        "✏️ Редактировать",
                        "edit_concert"
                      ),
                    ],
                    [Markup.button.callback("🗑 Удалить", "delete_concert")],
                    [
                      Markup.button.callback(
                        "🔙 Назад в главное меню",
                        "main_menu"
                      ),
                    ],
                  ]),
                }
              );
            } catch (error) {
              console.log("Ошибка обновления меню:", error.message);
            }
          }, 3000);
        } catch (error) {
          console.log("Ошибка удаления концерта:", error.message);
          await ctx.reply(
            "❌ Ошибка при удалении концерта. Попробуйте еще раз."
          );
        }
      } else if (ctx.session.waitingFor === "music_name") {
        await ctx.reply(`✅ Музыка "${text}" добавлена!`);
        ctx.session.waitingFor = null;

        setTimeout(async () => {
          try {
            await bot.telegram.editMessageText(
              ctx.session.chatId,
              ctx.session.messageId,
              null,
              `🎶 *Управление музыкой*\n\nВыберите действие:`,
              {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                  [Markup.button.callback("➕ Добавить музыку", "add_music")],
                  [Markup.button.callback("📋 Список музыки", "list_music")],
                  [Markup.button.callback("✏️ Редактировать", "edit_music")],
                  [Markup.button.callback("🗑 Удалить", "delete_music")],
                  [
                    Markup.button.callback(
                      "🔙 Назад в главное меню",
                      "main_menu"
                    ),
                  ],
                ]),
              }
            );
          } catch (error) {
            console.log("Ошибка обновления меню:", error.message);
          }
        }, 2000);
      }
    }
  });

  return bot;
};

module.exports = initBot;
