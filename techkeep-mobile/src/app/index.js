import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function Welcome() {
  return (
    <View style={styles.container}>

      {/* =========================
          TOP BRAND
      ========================= */}

      <View style={styles.topBrand}>

        <Text style={styles.logo}>
          TECHKEEP
        </Text>

        {/* SIMPLE BRAND CIRCLE */}

        <View style={styles.logoMark} />

      </View>


      {/* =========================
          MAIN CONTENT
      ========================= */}

      <View style={styles.centerContent}>

        {/* =========================
            ABSTRACT MARKETPLACE
        ========================= */}

        <View style={styles.visual}>

          {/* BACK SHAPE */}

          <View style={styles.backShape} />


          {/* MAIN PRODUCT CARD */}

          <View style={styles.productCard}>

            <View style={styles.productImage}>

              <View style={styles.productImageShape} />

            </View>


            <View style={styles.productDetails}>

              <View style={styles.longLine} />

              <View style={styles.shortLine} />

              <View style={styles.priceLine} />

            </View>

          </View>


          {/* SMALL CARD */}

          <View style={styles.smallCard}>

            <View style={styles.smallCardDot} />

            <View style={styles.smallCardLine} />

          </View>


          {/* FLOATING LABEL */}

          <View style={styles.label}>

            <Text style={styles.labelText}>
              FIND
            </Text>

          </View>

        </View>


        {/* =========================
            HEADLINE
        ========================= */}

        <View style={styles.textContent}>

          <Text style={styles.title}>
            Discover what
          </Text>

          <Text style={styles.titleBold}>
            keeps you going.
          </Text>


          <Text style={styles.description}>
            Your everyday finds, all in one place.
          </Text>

        </View>

      </View>


      {/* =========================
          GET STARTED
      ========================= */}

      <View style={styles.bottom}>

        <Pressable
          onPress={() => router.push("/auth")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >

          <Text style={styles.buttonText}>
            Get Started
          </Text>

          <View style={styles.arrowContainer}>

            <Text style={styles.arrow}>
              →
            </Text>

          </View>

        </Pressable>

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  // =====================================================
  // MAIN
  // =====================================================

  container: {
    flex: 1,

    backgroundColor: "#F8F8F8",

    paddingHorizontal: 25,

    // Slightly reduced top padding
    // to give the whole screen more vertical room.
    paddingTop: 48,

    // Extra bottom space for Android navigation bar.
    paddingBottom: 42,
  },


  // =====================================================
  // TOP BRAND
  // =====================================================

  topBrand: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    width: "100%",
  },

  logo: {
    fontSize: 22,

    fontWeight: "900",

    letterSpacing: 4.1,

    color: "#111111",
  },

  logoMark: {
    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor: "#111111",

    marginRight: 4,
  },


  // =====================================================
  // CENTER
  // =====================================================

  centerContent: {
    flex: 1,

    justifyContent: "center",

    // Keeps the visual/text slightly above
    // the absolute center so the CTA doesn't feel low.
    paddingBottom: 28,
  },


  // =====================================================
  // VISUAL
  // =====================================================

  visual: {
    width: "100%",

    height: 205,

    alignItems: "center",

    justifyContent: "center",

    position: "relative",

    marginBottom: 28,
  },

  backShape: {
    position: "absolute",

    width: 185,

    height: 185,

    borderRadius: 93,

    backgroundColor: "#E9E9E9",

    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },


  // =====================================================
  // MAIN PRODUCT CARD
  // =====================================================

  productCard: {
    width: 235,

    height: 128,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",

    alignItems: "center",

    padding: 14,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 8,
    },

    shadowOpacity: 0.08,

    shadowRadius: 16,

    elevation: 5,

    transform: [
      {
        rotate: "-3deg",
      },
    ],
  },

  productImage: {
    width: 82,

    height: 98,

    borderRadius: 13,

    backgroundColor: "#EEEEEE",

    alignItems: "center",

    justifyContent: "center",
  },

  productImageShape: {
    width: 38,

    height: 38,

    borderRadius: 10,

    backgroundColor: "#111111",

    transform: [
      {
        rotate: "45deg",
      },
    ],
  },

  productDetails: {
    flex: 1,

    marginLeft: 13,

    height: 82,

    justifyContent: "center",
  },

  longLine: {
    width: 65,

    height: 8,

    borderRadius: 4,

    backgroundColor: "#171717",

    marginBottom: 9,
  },

  shortLine: {
    width: 45,

    height: 6,

    borderRadius: 3,

    backgroundColor: "#CFCFCF",

    marginBottom: 17,
  },

  priceLine: {
    width: 32,

    height: 8,

    borderRadius: 4,

    backgroundColor: "#111111",
  },


  // =====================================================
  // SMALL CARD
  // =====================================================

  smallCard: {
    position: "absolute",

    width: 74,

    height: 55,

    right: 20,

    bottom: 18,

    borderRadius: 13,

    backgroundColor: "#111111",

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "row",

    gap: 7,

    transform: [
      {
        rotate: "7deg",
      },
    ],
  },

  smallCardDot: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: "#FFFFFF",
  },

  smallCardLine: {
    width: 25,

    height: 5,

    borderRadius: 3,

    backgroundColor: "#FFFFFF",
  },


  // =====================================================
  // FLOATING LABEL
  // =====================================================

  label: {
    position: "absolute",

    left: 26,

    bottom: 10,

    backgroundColor: "#FFFFFF",

    borderRadius: 9,

    paddingHorizontal: 12,

    paddingVertical: 8,

    borderWidth: 1,

    borderColor: "#E0E0E0",

    transform: [
      {
        rotate: "-6deg",
      },
    ],
  },

  labelText: {
    fontSize: 8,

    fontWeight: "900",

    letterSpacing: 1.5,

    color: "#111111",
  },


  // =====================================================
  // TEXT CONTENT
  // =====================================================

  textContent: {
    alignItems: "center",

    paddingHorizontal: 5,
  },

  title: {
    fontSize: 34,

    lineHeight: 39,

    fontWeight: "300",

    letterSpacing: -1.3,

    color: "#111111",

    textAlign: "center",
  },

  titleBold: {
    fontSize: 34,

    lineHeight: 39,

    fontWeight: "900",

    letterSpacing: -1.3,

    color: "#111111",

    textAlign: "center",
  },

  description: {
    maxWidth: 310,

    fontSize: 13.5,

    lineHeight: 20,

    fontWeight: "400",

    color: "#777777",

    textAlign: "center",

    marginTop: 15,
  },


  // =====================================================
  // BOTTOM
  // =====================================================

  bottom: {
    width: "100%",

    // Extra breathing room above Android nav.
    paddingBottom: 8,
  },


  // =====================================================
  // GET STARTED BUTTON
  // =====================================================

  button: {
    height: 58,

    width: "100%",

    backgroundColor: "#111111",

    borderRadius: 15,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingLeft: 21,

    paddingRight: 6,

    shadowColor: "#000000",

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.13,

    shadowRadius: 10,

    elevation: 4,
  },

  buttonPressed: {
    opacity: 0.85,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  buttonText: {
    color: "#FFFFFF",

    fontSize: 15.5,

    fontWeight: "700",

    letterSpacing: 0.1,
  },

  arrowContainer: {
    width: 46,

    height: 46,

    borderRadius: 11,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",
  },

  arrow: {
    color: "#111111",

    fontSize: 21,

    fontWeight: "400",

    marginTop: -2,
  },

});
