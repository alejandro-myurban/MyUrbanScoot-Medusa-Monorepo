import { Button, Link, Section, Text, Img, Hr, Row, Column } from "@react-email/components";
import { Base } from "./base";

/**
 * The key for the AppleReceiptEmail template, used to identify it
 */
export const APPLE_RECEIPT = "apple-receipt";

/**
 * The props for the AppleReceiptEmail template
 */
export interface AppleReceiptEmailProps {
  /**
   * Apple ID email address
   */
  appleId: string;
  /**
   * Invoice date
   */
  invoiceDate: string;
  /**
   * Order ID
   */
  orderId: string;
  /**
   * Document number
   */
  documentNo: string;
  /**
   * Customer name
   */
  customerName: string;
  /**
   * Customer address line 1
   */
  addressLine1: string;
  /**
   * Customer address line 2 (city, state, zip)
   */
  addressLine2: string;
  /**
   * Customer country
   */
  country: string;
  /**
   * Payment method
   */
  paymentMethod: string;
  /**
   * Product name
   */
  productName: string;
  /**
   * Product description
   */
  productDescription: string;
  /**
   * Renewal date
   */
  renewalDate: string;
  /**
   * Product price
   */
  price: string;
  /**
   * The preview text for the email
   */
  preview?: string;
  /**
   * Base URL for images
   */
  baseUrl?: string;
}

/**
 * Type guard for checking if the data is of type AppleReceiptEmailProps
 */
export const isAppleReceiptData = (data: any): data is AppleReceiptEmailProps =>
  typeof data.appleId === "string" &&
  typeof data.invoiceDate === "string" &&
  typeof data.orderId === "string" &&
  typeof data.documentNo === "string" &&
  typeof data.customerName === "string" &&
  typeof data.addressLine1 === "string" &&
  typeof data.addressLine2 === "string" &&
  typeof data.country === "string" &&
  typeof data.paymentMethod === "string" &&
  typeof data.productName === "string" &&
  typeof data.productDescription === "string" &&
  typeof data.renewalDate === "string" &&
  typeof data.price === "string";

/**
 * The AppleReceiptEmail template component built with react-email
 */
export const AppleReceiptEmail = ({
  appleId,
  invoiceDate,
  orderId,
  documentNo,
  customerName,
  addressLine1,
  addressLine2,
  country,
  paymentMethod,
  productName,
  productDescription,
  renewalDate,
  price,
  preview = "Apple Receipt",
  baseUrl = "",
}: AppleReceiptEmailProps) => {
  return (
    <Base preview={preview}>
      {/* Header */}
      <Section className="mb-4">
        <Row>
          <Column>
            <Img
              src={`${baseUrl}/static/apple-logo.png`}
              width="42"
              height="42"
              alt="Apple Logo"
            />
          </Column>
          <Column className="text-right">
            <Text className="text-[32px] font-light text-[#888888] m-0">
              Receipt
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Apple Card Promotion */}
      <Section className="text-center my-9">
        <Text className="text-[14px] font-medium text-[#111111] m-0">
          Save 3% on all your Apple purchases with Apple Card.
          <sup className="font-light">1</sup>{" "}
          <Link 
            href="https://www.apple.com/apple-card/"
            className="text-blue-600 underline"
          >
            Apply and use in minutes
          </Link>
          <sup className="font-light">2</sup>
        </Text>
      </Section>

      {/* Information Table */}
      <Section className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] mb-8">
        <Row className="min-h-[46px]">
          <Column className="pl-5 border-r border-b border-white min-h-[44px] w-1/2">
            <Section>
              <Row className="mb-2">
                <Column>
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    APPLE ID
                  </Text>
                  <Link className="text-[12px] text-[#1155cc] underline m-0 leading-[1.4]">
                    {appleId}
                  </Link>
                </Column>
              </Row>
              <Row className="mb-2">
                <Column>
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    INVOICE DATE
                  </Text>
                  <Text className="text-[12px] m-0 leading-[1.4]">
                    {invoiceDate}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column className="w-1/2">
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    ORDER ID
                  </Text>
                  <Link className="text-[12px] text-[#1155cc] underline m-0 leading-[1.4]">
                    {orderId}
                  </Link>
                </Column>
                <Column className="w-1/2">
                  <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
                    DOCUMENT NO.
                  </Text>
                  <Text className="text-[12px] m-0 leading-[1.4]">
                    {documentNo}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Column>
          <Column className="pl-5 border-b border-white min-h-[44px] w-1/2">
            <Text className="text-[10px] text-[#666666] m-0 leading-[1.4]">
              BILLED TO
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {paymentMethod}
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {customerName}
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {addressLine1}
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {addressLine2}
            </Text>
            <Text className="text-[12px] m-0 leading-[1.4]">
              {country}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Products Title */}
      <Section className="bg-[#fafafa] rounded border-collapse text-[12px] text-[#333333] my-8 min-h-[24px]">
        <Text className="bg-[#fafafa] pl-2.5 text-[14px] font-medium m-0">
          App Store
        </Text>
      </Section>

      {/* Product Details */}
      <Section className="mb-4">
        <Row>
          <Column className="w-16">
            <Img
              src={`${baseUrl}/static/apple-hbo-max-icon.jpeg`}
              width="64"
              height="64"
              alt="Product Icon"
              className="ml-5 rounded-[14px] border border-[#f2f2f2]"
            />
          </Column>
          <Column className="pl-5">
            <Text className="text-[12px] font-semibold m-0 leading-[1.4]">
              {productName}
            </Text>
            <Text className="text-[12px] text-[#666666] m-0 leading-[1.4]">
              {productDescription}
            </Text>
            <Text className="text-[12px] text-[#666666] m-0 leading-[1.4]">
              Renews {renewalDate}
            </Text>
            <div className="text-[12px]">
              <Link href="https://www.apple.com/" className="text-[#0070c9] no-underline">
                Write a Review
              </Link>
              <span className="mx-1 text-[#333333] font-light">|</span>
              <Link href="https://www.apple.com/" className="text-[#0070c9] no-underline">
                Report a Problem
              </Link>
            </div>
          </Column>
          <Column className="text-right pr-5 w-[100px] align-top">
            <Text className="text-[12px] font-semibold m-0">
              {price}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr className="border-0 border-t border-[#eaeaea] my-8" />

      {/* Total */}
      <Section className="text-right mb-4">
        <Row>
          <Column className="text-right pr-8">
            <Text className="text-[10px] font-semibold text-[#666666] m-0">
              TOTAL
            </Text>
          </Column>
          <Column className="min-h-[48px] pt-12 border-l border-[#eeeeee]">
          </Column>
          <Column className="w-[90px]">
            <Text className="text-[16px] font-semibold text-right mr-5 m-0 whitespace-nowrap">
              {price}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr className="border-0 border-t border-[#eaeaea] mb-[75px]" />

      {/* Apple Card Section */}
      <Section className="text-center mb-4">
        <Img
          src="https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png"
          width="60"
          height="17"
          alt="Apple Card"
        />
      </Section>

      <Section className="text-center mt-4">
        <Text className="text-[24px] font-medium">
          Save 3% on all your Apple purchases.
        </Text>
      </Section>

      <Section className="text-center my-2.5">
        <Link href="https://www.apple.com/" className="text-[#007eff] no-underline">
          <Img
            src="https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png"
            width="28"
            height="28"
            alt="Apple Wallet"
            className="inline pr-2 align-middle"
          />
          <span className="text-[14px] font-normal no-underline">
            Apply and use in minutes
          </span>
        </Link>
      </Section>

      <Hr className="border-0 border-t border-[#eaeaea] mt-16 mb-5" />

      {/* Footer */}
      <Section className="text-[12px] text-[#666666] leading-auto mb-4">
        <Text className="mb-4">
          1. 3% savings is earned as Daily Cash and is transferred to your Apple
          Cash card when transactions post to your Apple Card account. If you do
          not have an Apple Cash card, Daily Cash can be applied by you as a
          credit on your statement balance. 3% is the total amount of Daily Cash
          earned for these purchases. See the Apple Card Customer Agreement for
          more details on Daily Cash and qualifying transactions.
        </Text>
        <Text className="mb-4">2. Subject to credit approval.</Text>
        <Text className="mb-4">
          To access and use all the features of Apple Card, you must add Apple
          Card to Wallet on an iPhone or iPad with iOS or iPadOS 13.2 or later.
          Update to the latest version of iOS or iPadOS by going to Settings
          &gt; General &gt; Software Update. Tap Download and Install.
        </Text>
        <Text className="mb-4">
          Available for qualifying applicants in the United States.
        </Text>
        <Text className="mb-4">
          Apple Card is issued by Goldman Sachs Bank USA, Salt Lake City Branch.
        </Text>
        <Text className="mb-4">
          If you reside in the US territories, please call Goldman Sachs at
          877-255-5923 with questions about Apple Card.
        </Text>
      </Section>

      <Section className="text-center text-[12px] text-[#666666] leading-auto my-5">
        <Text>
          Privacy: We use a
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            {" "}Subscriber ID{" "}
          </Link>
          to provide reports to developers.
        </Text>
        <Text>
          Get help with subscriptions and purchases.
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            Visit Apple Support.
          </Link>
        </Text>
        <Text>
          Learn how to{" "}
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            manage your password preferences
          </Link>{" "}
          for iTunes, Apple Books, and App Store purchases.
        </Text>
        <Text>
          You have the option to stop receiving email receipts for your
          subscription renewals. If you have opted out, you can still view your
          receipts in your account under Purchase History. To manage receipts or
          to opt in again, go to{" "}
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            Account Settings.
          </Link>
        </Text>
      </Section>

      <Section className="text-center my-10">
        <Img
          src="https://myurbanscoot.com/wp-content/uploads/2025/05/cropped-logo-myurbanscoot-vertical-2025-05-382x101.png"
          width="26"
          height="26"
          alt="Apple Logo"
        />
      </Section>

      <Section className="text-center text-[12px] text-[#666666] mt-2">
        <Text>
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            Account Settings
          </Link>{" "}
          •{" "}
          <Link href="https://www.apple.com/" className="text-[#0073ff]">
            Terms of Sale
          </Link>{" "}
          •{" "}
          <Link href="https://www.apple.com/legal/privacy/" className="text-[#0073ff]">
            Privacy Policy
          </Link>
        </Text>
      </Section>

      <Section className="text-center text-[12px] text-[#666666] mt-6">
        <Text>
          Copyright © 2023 Apple Inc. <br />
          <Link href="https://www.apple.com/legal/" className="text-[#0073ff]">
            All rights reserved
          </Link>
        </Text>
      </Section>
    </Base>
  );
};

AppleReceiptEmail.PreviewProps = {
  appleId: "alan.turing@gmail.com",
  invoiceDate: "18 Jan 2023",
  orderId: "ML4F5L8522",
  documentNo: "186623754793",
  customerName: "Alan Turing",
  addressLine1: "2125 Chestnut St",
  addressLine2: "San Francisco, CA 94123",
  country: "USA",
  paymentMethod: "Visa .... 7461 (Apple Pay)",
  productName: "HBO Max: Stream TV & Movies",
  productDescription: "HBO Max Ad-Free (Monthly)",
  renewalDate: "Aug 20, 2023",
  price: "$14.99",
  baseUrl: "",
} as AppleReceiptEmailProps;

export default AppleReceiptEmail;