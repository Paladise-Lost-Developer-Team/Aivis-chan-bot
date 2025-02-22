import { joinVoiceChannel } from '@discordjs/voice';
import { VoiceChannel, TextChannel } from 'discord.js';
import { speakVoice, play_audio } from '../index.ts';

const textChannels = {};
const voiceClients = {};
const currentSpeaker = {};

module.exports = async function joinCommand(interaction) {
    if (interaction.commandName === "join") {
        let voiceChannel = interaction.options.get("voice_channel")?.channel as VoiceChannel;
        let textChannel = interaction.options.get("text_channel")?.channel as TextChannel;

        if (!voiceChannel) {
            const member = interaction.guild?.members.cache.get(interaction.user.id);
            if (member?.voice.channel) {
                voiceChannel = member.voice.channel as VoiceChannel;
            } else {
                await interaction.reply("ボイスチャンネルが指定されておらず、あなたはボイスチャンネルに接続していません。");
                return;
            }
        }

        if (!textChannel) {
            textChannel = interaction.channel as TextChannel;
        }

        const guildId = interaction.guildId!;
        textChannels[guildId] = textChannel;

        try {
            let voiceClient = voiceClients[guildId];
            if (voiceClient) {
                await voiceClient.disconnect();
            }
            voiceClient = await joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guildId,
                adapterCreator: interaction.guild!.voiceAdapterCreator as any
            });
            voiceClients[guildId] = voiceClient;
            await interaction.reply(`${voiceChannel.name} に接続しました。`);

            const path = await speakVoice("接続しました。", currentSpeaker[guildId] || 888753760, guildId);
            await play_audio(voiceClient, path, guildId, interaction);
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply("ボイスチャンネルへの接続に失敗しました。");
            }
        }
    }
};