import { Client, Events, GatewayIntentBits, ActivityType, MessageFlags, Collection } from "discord.js";
import { deployCommands } from "./deploy-commands"; // 相対パスを使用してインポート
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import * as fs from "fs";
import { TOKEN } from "./config.json";
import { AivisAdapter, loadAutoJoinChannels, voiceClients } from "./TTS-Engine"; // 相対パスを修正
import { ServerStatus, fetchUUIDsPeriodically } from "./dictionaries"; // 相対パスを修正
import { MessageCreate } from "./MessageCreate";
import { VoiceStateUpdate } from "./VoiceStateUpdate";
import path from 'path';
import loadCommands from './load-commands';  // 追加

interface ExtendedClient extends Client {
    commands: Collection<string, any>;
}

export const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] }) as ExtendedClient;

// 追加: コマンドコレクションを初期化し、loadCommands()から読み込む
client.commands = loadCommands();

const rest = new REST({ version: '9' }).setToken(TOKEN);

new AivisAdapter(); // AivisAdapterのインスタンスを生成

client.once(Events.ClientReady, async () => {
    await deployCommands();
    await MessageCreate(client); // 非同期関数として呼び出す
    await VoiceStateUpdate(client); // 非同期関数として呼び出す
    console.log("起動完了");
    client.user!.setActivity("起動中…", { type: ActivityType.Playing });
    setInterval(async () => {
        const joinServerCount = client.guilds.cache.size;
        await client.user!.setActivity(`サーバー数: ${joinServerCount}`, { type: ActivityType.Custom });
        await new Promise(resolve => setTimeout(resolve, 15000));
        const joinVCCount = client.voice.adapters.size;
        client.user!.setActivity(`VC: ${joinVCCount}`, { type: ActivityType.Custom });
        await new Promise(resolve => setTimeout(resolve, 15000));
    }, 30000);

    fetchUUIDsPeriodically();
    client.guilds.cache.forEach(guild => {
        new ServerStatus(guild.id); // 各ギルドのIDを保存するタスクを開始
    });
});

client.on(Events.InteractionCreate, async interaction => {    
    if (!interaction.isChatInputCommand()) return;

    // Bot起動時にloadAutoJoinChannels()関数を実行
    loadAutoJoinChannels();
    console.log("Auto join channels loaded.");

    try {
        const guildId = fs.readFileSync('guild_id.txt', 'utf-8').trim();
        if (!guildId) {
            throw new Error("GUILD_ID is not defined in the guild_id.txt file.");
        }

        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'このコマンドの実行中にエラーが発生しました。', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'このコマンドの実行中にエラーが発生しました', flags: MessageFlags.Ephemeral });
            }
        }
        console.log(`${command.data.name} コマンドを同期しました`);
    } catch (error) {
        console.error(error);
    }
});

client.login(TOKEN);