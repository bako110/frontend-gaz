import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '@/styles/services';

export default function ServicesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const services = [
    {
      id: 1,
      title: "Livraison Express",
      description: "Recevez votre bouteille de gaz en moins de 2 heures !",
      icon: "rocket",
      color: ["#FF6B9D", "#FF8FA3"],
      iconColor: "#fff",
    },
    {
      id: 2,
      title: "Paiement Sécurisé",
      description: "Payez en ligne ou à la livraison en toute sécurité.",
      icon: "credit-card",
      color: ["#4ECDC4", "#44A08D"],
      iconColor: "#fff",
    },
    {
      id: 3,
      title: "Abonnement Mensuel",
      description: "Bénéficiez d'une livraison automatique chaque mois.",
      icon: "calendar-check",
      color: ["#4D96FF", "#6366F1"],
      iconColor: "#fff",
    },
    {
      id: 4,
      title: "Service Client 24/7",
      description: "Notre équipe est disponible à tout moment pour vous aider.",
      icon: "headset",
      color: ["#A855F7", "#C084FC"],
      iconColor: "#fff",
    },
    {
      id: 5,
      title: "Promotions Exclusives",
      description: "Profitez de réductions spéciales toute l'année.",
      icon: "tag-heart",
      color: ["#F59E0B", "#EF4444"],
      iconColor: "#fff",
    },
    {
      id: 6,
      title: "Suivi en Temps Réel",
      description: "Suivez votre livraison en direct sur la carte.",
      icon: "map-marker-path",
      color: ["#10B981", "#3B82F6"],
      iconColor: "#fff",
    },
  ];

  const testimonials = [
    {
      id: 1,
      name: "Awa T.",
      comment: "Service ultra-rapide et livraison impeccable ! Je recommande à 100%.",
      stars: 5,
      avatarColor: "#FF6B9D",
    },
    {
      id: 2,
      name: "Karim D.",
      comment: "Paiement sécurisé et équipe très professionnelle. Merci !",
      stars: 5,
      avatarColor: "#4ECDC4",
    },
    {
      id: 3,
      name: "Fatou S.",
      comment: "Les promotions sont incroyables. J'économise beaucoup grâce à eux.",
      stars: 4,
      avatarColor: "#4D96FF",
    },
  ];

  const Header = () => (
    <LinearGradient
      colors={["#4D96FF", "#6366F1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Nos Services</Text>
        <Text style={styles.headerSubtitle}>Tout pour votre confort et votre sécurité</Text>
      </View>
    </LinearGradient>
  );

  const ServiceCard = ({ service }) => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.serviceCard} activeOpacity={0.8}>
        <LinearGradient
          colors={service.color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.serviceCardGradient}
        >
          <View style={styles.serviceIconContainer}>
            <MaterialCommunityIcons
              name={service.icon}
              size={32}
              color={service.iconColor}
            />
          </View>
          <Text style={styles.serviceTitle}>{service.title}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const TestimonialCard = ({ testimonial }) => (
    <View style={styles.testimonialCard}>
      <View style={[styles.testimonialAvatar, { backgroundColor: testimonial.avatarColor }]}>
        <MaterialCommunityIcons name="account" size={24} color="#fff" />
      </View>
      <View style={styles.testimonialContent}>
        <Text style={styles.testimonialName}>{testimonial.name}</Text>
        <View style={styles.starsContainer}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name={i < testimonial.stars ? "star" : "star-outline"}
              size={16}
              color={i < testimonial.stars ? "#FFD700" : "#E5E7EB"}
            />
          ))}
        </View>
        <Text style={styles.testimonialComment}>{testimonial.comment}</Text>
      </View>
    </View>
  );

  const FloatingActionButton = () => (
    <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
      <LinearGradient
        colors={["#4D96FF", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabGradient}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4D96FF", "#6366F1"]}
            tintColor="#4D96FF"
            progressBackgroundColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Découvrez Nos Services</Text>
          <FlatList
            data={services}
            renderItem={({ item }) => <ServiceCard service={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.serviceRow}
            scrollEnabled={false}
          />
          <Text style={styles.sectionTitle}>Témoignages</Text>
          <FlatList
            data={testimonials}
            renderItem={({ item }) => <TestimonialCard testimonial={item} />}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsList}
          />
        </View>
      </ScrollView>
      <FloatingActionButton />
    </View>
  );
}
